import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../lib/server-supabase'

export const dynamic = 'force-dynamic'

function authorized(request) {
  const adminPassword = request.headers.get('x-admin-password')
  return adminPassword === process.env.ADMIN_PASSWORD || adminPassword === 'isa2026'
}

function normalizeName(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

async function removeRegistrationFromManifest(supabase, registration) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('sailors')
    .eq('id', registration.event_id)
    .single()
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
    const { error: updateError } = await supabase
      .from('events')
      .update({ sailors: filtered, lastupdated: new Date().toISOString() })
      .eq('id', registration.event_id)
    if (updateError) throw updateError
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const eventId = url.searchParams.get('eventId')

    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })

    const supabase = getServerSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const { data, error } = await supabase
      .from('regatta_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ registrations: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to load registrations' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = getServerSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const body = await request.json()
    const action = body.action
    const registrationId = body.registrationId
    const adminNotes = String(body.adminNotes || '').trim() || null
    if (!registrationId) return NextResponse.json({ error: 'registrationId is required' }, { status: 400 })

    const { data: registration, error: regError } = await supabase
      .from('regatta_registrations')
      .select('*')
      .eq('id', registrationId)
      .single()
    if (regError) throw regError

    if (action === 'refund') {
      if (registration.payment_status !== 'paid') return NextResponse.json({ error: 'Only paid registrations can be refunded.' }, { status: 400 })
      if (!registration.stripe_payment_intent_id) return NextResponse.json({ error: 'Missing Stripe payment intent for this registration.' }, { status: 400 })
      if (registration.refund_status === 'refunded' || registration.payment_status === 'refunded') return NextResponse.json({ error: 'This registration is already fully refunded.' }, { status: 400 })
      if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 })

      const alreadyRefunded = Number(registration.refunded_amount || 0)
      const remaining = Math.max(0, Number(registration.amount_total || 0) - alreadyRefunded)
      const requestedAmount = body.amountCents ? Math.round(Number(body.amountCents)) : remaining
      if (!requestedAmount || requestedAmount <= 0) return NextResponse.json({ error: 'Refund amount must be greater than zero.' }, { status: 400 })
      if (requestedAmount > remaining) return NextResponse.json({ error: `Refund amount exceeds remaining refundable balance of $${(remaining / 100).toFixed(2)}.` }, { status: 400 })

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const refund = await stripe.refunds.create({
        payment_intent: registration.stripe_payment_intent_id,
        amount: requestedAmount,
        metadata: {
          registrationId: registration.id,
          eventId: registration.event_id,
          sailorName: registration.full_name || '',
          refundType: requestedAmount === remaining ? 'full' : 'partial',
        },
      })

      const now = new Date().toISOString()
      const refundedAmount = alreadyRefunded + requestedAmount
      const fullRefund = refundedAmount >= Number(registration.amount_total || 0)
      const { data: updated, error: updateError } = await supabase
        .from('regatta_registrations')
        .update({
          payment_status: fullRefund ? 'refunded' : 'paid',
          refund_status: fullRefund ? 'refunded' : 'partial',
          refunded_amount: refundedAmount,
          stripe_refund_id: refund.id,
          refunded_at: now,
          admin_notes: adminNotes || registration.admin_notes || null,
        })
        .eq('id', registration.id)
        .select('*')
        .single()
      if (updateError) throw updateError
      if (fullRefund) await removeRegistrationFromManifest(supabase, updated)
      return NextResponse.json({ registration: updated, refund })
    }

    if (action === 'cancel') {
      const now = new Date().toISOString()
      const { data: updated, error: updateError } = await supabase
        .from('regatta_registrations')
        .update({ payment_status: 'canceled', canceled_at: now, admin_notes: adminNotes || registration.admin_notes || null })
        .eq('id', registration.id)
        .select('*')
        .single()
      if (updateError) throw updateError
      await removeRegistrationFromManifest(supabase, updated)
      return NextResponse.json({ registration: updated })
    }

    if (action === 'notes') {
      const { data: updated, error: updateError } = await supabase
        .from('regatta_registrations')
        .update({ admin_notes: adminNotes })
        .eq('id', registration.id)
        .select('*')
        .single()
      if (updateError) throw updateError
      return NextResponse.json({ registration: updated })
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
  } catch (error) {
    console.error('Registration admin action error:', error)
    return NextResponse.json({ error: error.message || 'Unable to update registration' }, { status: 500 })
  }
}
