import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(_: Request, { params }: { params: { token: string } }) {
  // Look up attendee by token
  const { data: att, error } = await supabaseAdmin
    .from('ww_attendees')
    .select('*')
    .eq('token', params.token)
    .single()

  if (error || !att) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get the event
  const { data: ev } = await supabaseAdmin.from('ww_events').select('*').eq('id', att.event_id).single()
  if (!ev) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  // Get all attendees + their availability (so we can show who's filled in)
  const [{ data: attendees }, { data: availability }] = await Promise.all([
    supabaseAdmin.from('ww_attendees').select('*').eq('event_id', att.event_id),
    supabaseAdmin.from('ww_availability').select('*').eq('event_id', att.event_id),
  ])

  const attendeesWithAvail = (attendees || []).map(a => ({
    ...a,
    availability: Object.fromEntries(
      (availability || []).filter(av => av.attendee_id === a.id).map(av => [av.date, av.status])
    ),
  }))

  // Return the event (without notifications — attendees don't need those) + the specific attendee
  return NextResponse.json({
    event: { ...ev, attendees: attendeesWithAvail, notifications: [] },
    attendee: attendeesWithAvail.find(a => a.id === att.id),
  })
}
