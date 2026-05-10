import { NextResponse } from 'next/server'
import { getServerSupabase } from '../../lib/server-supabase'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const eventId = url.searchParams.get('eventId')
    const adminPassword = request.headers.get('x-admin-password')

    if (adminPassword !== process.env.ADMIN_PASSWORD && adminPassword !== 'isa2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

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
