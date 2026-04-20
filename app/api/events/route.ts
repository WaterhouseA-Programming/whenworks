import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: events, error } = await supabaseAdmin
    .from('ww_events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with attendees + notifications
  const enriched = await Promise.all(
    events.map(async (ev) => {
      const [{ data: attendees }, { data: availability }, { data: notifications }] = await Promise.all([
        supabaseAdmin.from('ww_attendees').select('*').eq('event_id', ev.id),
        supabaseAdmin.from('ww_availability').select('*').eq('event_id', ev.id),
        supabaseAdmin.from('ww_notifications').select('*').eq('event_id', ev.id).order('created_at', { ascending: false }),
      ])

      const attendeesWithAvail = (attendees || []).map((a) => ({
        ...a,
        availability: Object.fromEntries(
          (availability || []).filter(av => av.attendee_id === a.id).map(av => [av.date, av.status])
        ),
      }))

      return { ...ev, attendees: attendeesWithAvail, notifications: notifications || [] }
    })
  )

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    title, description, organiser_name, organiser_email,
    colour, start_date, days_to_show, duration, nudge_after,
    time_slots,
  } = body

  if (!title || !organiser_name || !organiser_email || !start_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create event
  const { data: event, error: evErr } = await supabaseAdmin
    .from('ww_events')
    .insert({ title, description, organiser_name, organiser_email, colour: colour || '#5b8ef0', start_date, days_to_show: days_to_show || 14, duration: duration || 1, nudge_after: nudge_after ?? 2, time_slots: time_slots || ['allday'] })
    .select()
    .single()

  if (evErr || !event) return NextResponse.json({ error: evErr?.message }, { status: 500 })

  // Create organiser attendee
  const { data: attendee, error: attErr } = await supabaseAdmin
    .from('ww_attendees')
    .insert({ event_id: event.id, name: organiser_name, email: organiser_email, is_organiser: true })
    .select()
    .single()

  if (attErr) return NextResponse.json({ error: attErr?.message }, { status: 500 })

  return NextResponse.json({ ...event, attendees: [{ ...attendee, availability: {} }], notifications: [] }, { status: 201 })
}
