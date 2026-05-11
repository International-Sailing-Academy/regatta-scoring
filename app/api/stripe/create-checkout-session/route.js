import Stripe from 'stripe'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/server-supabase'
import {
  cleanRegistrationPayload,
  validateRegistration,
  registrationAddOns,
  registrationTotalCents,
  sailorTotalCents,
  REGATTA_CURRENCY,
  REGATTA_EVENT_ID,
  REGATTA_PRICE_CENTS,
} from '../../../lib/registration'

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 })
    const supabase = getServerSupabase()
    if (!supabase) return NextResponse.json({ error: 'Registration database is not configured.' }, { status: 503 })

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mexicanmidwinters.com'
    const payload = cleanRegistrationPayload(await request.json())
    const errors = validateRegistration(payload)
    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })

    const { data: existingPaid } = await supabase
      .from('regatta_registrations')
      .select('id, full_name, sail_number')
      .eq('event_id', REGATTA_EVENT_ID)
      .eq('payment_status', 'paid')
      .in('sail_number', payload.sailors.map(s => s.sailNumber))

    if (existingPaid?.length) {
      return NextResponse.json({ error: `Already registered sail number(s): ${existingPaid.map(r => r.sail_number).join(', ')}` }, { status: 409 })
    }

    const groupId = randomUUID()
    const totalCents = registrationTotalCents(payload)
    const rows = payload.sailors.map(sailor => ({
      event_id: REGATTA_EVENT_ID,
      registration_group_id: groupId,
      purchaser_name: payload.purchaser.fullName,
      purchaser_email: payload.purchaser.email,
      purchaser_phone: payload.purchaser.whatsapp || payload.purchaser.phone || null,
      payment_status: 'pending',
      amount_total: sailorTotalCents(sailor),
      currency: REGATTA_CURRENCY,
      full_name: sailor.fullName,
      email: payload.purchaser.email,
      phone: payload.purchaser.phone || null,
      whatsapp: payload.purchaser.whatsapp || null,
      country: sailor.country || null,
      sail_number: sailor.sailNumber || null,
      boat_class: sailor.boatClass,
      scoring_category: sailor.scoringCategory,
      tshirt_size: sailor.tshirtSize,
      birth_year: sailor.birthYear,
      emergency_contact_name: payload.purchaser.emergencyContactName || null,
      emergency_contact_phone: payload.purchaser.emergencyContactPhone || null,
      medical_conditions: sailor.medicalConditions || null,
      charter_dates: sailor.charterDates || null,
      charter_days_short: sailor.charterDaysShort,
      charter_days_extended: sailor.charterDaysExtended,
      pro_kit_rental: sailor.proKitRental,
      boat_insurance: sailor.boatInsurance,
      notes: sailor.notes || null,
      waiver_accepted: payload.waiverAccepted,
    }))

    const { data: registrations, error: insertError } = await supabase
      .from('regatta_registrations')
      .insert(rows)
      .select('*')

    if (insertError) throw insertError

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const lineItems = payload.sailors.flatMap((sailor, index) => [
      {
        quantity: 1,
        price_data: {
          currency: REGATTA_CURRENCY,
          unit_amount: REGATTA_PRICE_CENTS,
          product_data: {
            name: `Entry — ${sailor.fullName}`,
            description: `${sailor.boatClass} • ${sailor.scoringCategory}`,
          },
        },
      },
      ...registrationAddOns(sailor).map(item => ({
        quantity: item.quantity,
        price_data: {
          currency: REGATTA_CURRENCY,
          unit_amount: item.unitAmount,
          product_data: {
            name: `${item.label} — ${sailor.fullName}`,
            description: 'Mexican Midwinters registration add-on',
          },
        },
      })),
    ])

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: payload.purchaser.email,
      client_reference_id: groupId,
      success_url: `${origin}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register/cancel?registration=${groupId}`,
      metadata: {
        registrationGroupId: groupId,
        eventId: REGATTA_EVENT_ID,
        purchaserName: payload.purchaser.fullName,
        sailorCount: String(payload.sailors.length),
      },
      payment_intent_data: {
        receipt_email: payload.purchaser.email,
        description: `Mexican Midwinters 2027 registration — ${payload.sailors.length} sailor${payload.sailors.length === 1 ? '' : 's'}`,
      },
      custom_text: {
        after_submit: {
          message: 'Registration complete. Please join the official regatta WhatsApp group from the confirmation page for race-office updates and logistics.',
        },
      },
      line_items: lineItems,
    })

    await supabase
      .from('regatta_registrations')
      .update({ stripe_checkout_session_id: session.id })
      .eq('registration_group_id', groupId)

    return NextResponse.json({ url: session.url, registrationGroupId: groupId, sailorCount: registrations.length, totalCents })
  } catch (error) {
    console.error('create-checkout-session error', error)
    return NextResponse.json({ error: error.message || 'Unable to start checkout.' }, { status: 500 })
  }
}
