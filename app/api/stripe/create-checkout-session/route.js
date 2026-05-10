import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/server-supabase'
import { cleanRegistrationPayload, validateRegistration, REGATTA_CURRENCY, REGATTA_EVENT_ID, REGATTA_PRICE_CENTS } from '../../../lib/registration'

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 })
    }

    const supabase = getServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Registration database is not configured.' }, { status: 503 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mexicanmidwinters.com'
    const payload = cleanRegistrationPayload(await request.json())
    const errors = validateRegistration(payload)
    if (errors.length) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    const { data: existingPaid } = await supabase
      .from('regatta_registrations')
      .select('id')
      .eq('event_id', REGATTA_EVENT_ID)
      .eq('payment_status', 'paid')
      .ilike('email', payload.email)
      .maybeSingle()

    if (existingPaid) {
      return NextResponse.json({ error: 'A paid registration already exists for this email.' }, { status: 409 })
    }

    const { data: registration, error: insertError } = await supabase
      .from('regatta_registrations')
      .insert({
        event_id: REGATTA_EVENT_ID,
        payment_status: 'pending',
        amount_total: REGATTA_PRICE_CENTS,
        currency: REGATTA_CURRENCY,
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone || null,
        country: payload.country || null,
        sail_number: payload.sailNumber || null,
        boat_class: payload.boatClass,
        scoring_category: payload.scoringCategory,
        birth_year: payload.birthYear,
        emergency_contact_name: payload.emergencyContactName || null,
        emergency_contact_phone: payload.emergencyContactPhone || null,
        notes: payload.notes || null,
        waiver_accepted: payload.waiverAccepted,
      })
      .select('*')
      .single()

    if (insertError) throw insertError

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: payload.email,
      client_reference_id: registration.id,
      success_url: `${origin}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/register/cancel?registration=${registration.id}`,
      metadata: {
        registrationId: registration.id,
        eventId: REGATTA_EVENT_ID,
        sailorName: payload.fullName,
        boatClass: payload.boatClass,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: REGATTA_CURRENCY,
            unit_amount: REGATTA_PRICE_CENTS,
            product_data: {
              name: 'ILCA Mexican Midwinter Regatta 2027 Entry',
              description: 'March 11–13, 2027 • La Cruz de Huanacaxtle, Mexico',
            },
          },
        },
      ],
    })

    await supabase
      .from('regatta_registrations')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', registration.id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('create-checkout-session error', error)
    return NextResponse.json({ error: error.message || 'Unable to start checkout.' }, { status: 500 })
  }
}
