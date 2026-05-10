import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/server-supabase'
import { registrationToSailor } from '../../../lib/registration'

export const dynamic = 'force-dynamic'

function normalizeName(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

async function markRegistrationPaid(session) {
  const supabase = getServerSupabase()
  if (!supabase) throw new Error('Supabase not configured')

  const registrationId = session.metadata?.registrationId || session.client_reference_id
  if (!registrationId) throw new Error('Missing registration id')

  const { data: registration, error: regError } = await supabase
    .from('regatta_registrations')
    .update({
      payment_status: 'paid',
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null,
      paid_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .select('*')
    .single()

  if (regError) throw regError

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', registration.event_id)
    .single()

  if (eventError) throw eventError

  const sailors = Array.isArray(event.sailors) ? event.sailors : []
  const sailor = registrationToSailor(registration)
  const duplicate = sailors.some(existing =>
    normalizeName(existing.name) === normalizeName(sailor.name) &&
    String(existing.boatClass || '').toLowerCase() === String(sailor.boatClass || '').toLowerCase()
  )

  if (!duplicate) {
    const updatedSailors = [...sailors, sailor]
    const { error: updateError } = await supabase
      .from('events')
      .update({ sailors: updatedSailors, lastupdated: new Date().toISOString() })
      .eq('id', registration.event_id)

    if (updateError) throw updateError
  }

  return registration
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 503 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)

    if (event.type === 'checkout.session.completed') {
      await markRegistrationPaid(event.data.object)
    }

    if (event.type === 'checkout.session.expired') {
      const supabase = getServerSupabase()
      const registrationId = event.data.object.metadata?.registrationId || event.data.object.client_reference_id
      if (supabase && registrationId) {
        await supabase.from('regatta_registrations').update({ payment_status: 'canceled' }).eq('id', registrationId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('stripe webhook error', error)
    return NextResponse.json({ error: error.message || 'Webhook error' }, { status: 400 })
  }
}
