import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../../lib/server-supabase'
import { registrationToSailor } from '../../../lib/registration'

export const dynamic = 'force-dynamic'

function normalizeName(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function sailorDuplicate(sailors, sailor) {
  return sailors.some(existing => normalizeName(existing.name) === normalizeName(sailor.name) && String(existing.boatClass || '').toLowerCase() === String(sailor.boatClass || '').toLowerCase())
}

async function removeRegistrationFromManifest(supabase, registration) {
  const { data: event, error: eventError } = await supabase.from('events').select('sailors').eq('id', registration.event_id).single()
  if (eventError) throw eventError
  const sailors = Array.isArray(event.sailors) ? event.sailors : []
  const filtered = sailors.filter(sailor => {
    if (sailor.registrationId && sailor.registrationId === registration.id) return false
    const sameName = normalizeName(sailor.name || '') === normalizeName(registration.full_name || '')
    const sameSail = String(sailor.sailNumber || '').trim().toUpperCase() === String(registration.sail_number || '').trim().toUpperCase()
    const sameClass = String(sailor.boatClass || '').trim().toLowerCase() === String(registration.boat_class || '').trim().toLowerCase()
    return !(sameName && sameSail && sameClass)
  })
  if (filtered.length !== sailors.length) {
    const { error } = await supabase.from('events').update({ sailors: filtered, lastupdated: new Date().toISOString() }).eq('id', registration.event_id)
    if (error) throw error
  }
}

async function markRegistrationPaid(session) {
  const supabase = getServerSupabase()
  if (!supabase) throw new Error('Supabase not configured')
  const groupId = session.metadata?.registrationGroupId || session.client_reference_id
  const legacyRegistrationId = session.metadata?.registrationId
  if (!groupId && !legacyRegistrationId) throw new Error('Missing registration id')

  let query = supabase.from('regatta_registrations').update({ payment_status: 'paid', stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null, paid_at: new Date().toISOString() })
  query = legacyRegistrationId ? query.eq('id', legacyRegistrationId) : query.eq('registration_group_id', groupId)
  const { data: registrations, error: regError } = await query.select('*')
  if (regError) throw regError
  if (!registrations?.length) throw new Error('No registrations found for checkout session')

  const eventId = registrations[0].event_id
  const { data: event, error: eventError } = await supabase.from('events').select('*').eq('id', eventId).single()
  if (eventError) throw eventError

  const sailors = Array.isArray(event.sailors) ? event.sailors : []
  const additions = registrations.map(registrationToSailor).filter(sailor => !sailorDuplicate(sailors, sailor))
  if (additions.length) {
    const { error: updateError } = await supabase.from('events').update({ sailors: [...sailors, ...additions], lastupdated: new Date().toISOString() }).eq('id', eventId)
    if (updateError) throw updateError
  }
  return registrations
}

async function markRefunded(refund) {
  const supabase = getServerSupabase()
  if (!supabase) throw new Error('Supabase not configured')
  const registrationId = refund.metadata?.registrationId
  if (!registrationId) return null
  const { data: registration, error } = await supabase
    .from('regatta_registrations')
    .update({ payment_status: 'refunded', refund_status: 'refunded', stripe_refund_id: refund.id, refunded_at: new Date().toISOString() })
    .eq('id', registrationId)
    .select('*')
    .single()
  if (error) throw error
  await removeRegistrationFromManifest(supabase, registration)
  return registration
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 503 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)

    if (event.type === 'checkout.session.completed') await markRegistrationPaid(event.data.object)
    if (event.type === 'charge.refunded' || event.type === 'refund.updated') {
      const refund = event.type === 'charge.refunded' ? event.data.object.refunds?.data?.[0] : event.data.object
      if (refund) await markRefunded(refund)
    }
    if (event.type === 'checkout.session.expired') {
      const supabase = getServerSupabase()
      const groupId = event.data.object.metadata?.registrationGroupId || event.data.object.client_reference_id
      const legacyRegistrationId = event.data.object.metadata?.registrationId
      if (supabase && (groupId || legacyRegistrationId)) {
        let query = supabase.from('regatta_registrations').update({ payment_status: 'canceled', canceled_at: new Date().toISOString() })
        query = legacyRegistrationId ? query.eq('id', legacyRegistrationId) : query.eq('registration_group_id', groupId)
        await query
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('stripe webhook error', error)
    return NextResponse.json({ error: error.message || 'Webhook error' }, { status: 400 })
  }
}
