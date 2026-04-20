import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { bestDates, fmtDate, getDates } from '@/lib/utils'
import { sendOrganizerAllFilledEmail } from '@/lib/email'
import type { AttendeeWithAvail } from '@/types'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { availability } = await req.json()
  // availability: Record<string, 'free'|'busy'|'maybe'>

  // Get attendee + event
  const { data: att } = await supabaseAdmin.from('ww_attendees').select('*, ww_events(*)').eq('id', params.id).single()
  if (!att) return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })

  const ev = att.ww_events as any

  // Upsert all availability rows
  const rows = Object.entries(availability).map(([date, status]) => ({
    attendee_id: params.id,
    event_id: att.event_id,
    date,
    status,
  }))

  // Delete existing and re-insert (simplest upsert for date ranges)
  await supabaseAdmin.from('ww_availability').delete().eq('attendee_id', params.id)
  if (rows.length > 0) {
    const { error } = await supabaseAdmin.from('ww_availability').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if all attendees have now filled in
  const { data: allAttendees } = await supabaseAdmin.from('ww_attendees').select('id').eq('event_id', att.event_id)
  const { data: allAvail } = await supabaseAdmin.from('ww_availability').select('attendee_id').eq('event_id', att.event_id)

  const filledIds = new Set((allAvail || []).map(a => a.attendee_id))
  const allFilled = (allAttendees || []).every(a => filledIds.has(a.id))

  if (allFilled) {
    // Check we haven't already fired this notification
    const { data: existing } = await supabaseAdmin
      .from('ww_notifications').select('id').eq('event_id', att.event_id).eq('type', 'all_filled').limit(1)

    if (!existing?.length) {
      // Compute best date to mention
      const { data: attendeesRaw } = await supabaseAdmin.from('ww_attendees').select('*').eq('event_id', att.event_id)
      const { data: availRaw } = await supabaseAdmin.from('ww_availability').select('*').eq('event_id', att.event_id)
      const attendeesWithAvail: AttendeeWithAvail[] = (attendeesRaw || []).map(a => ({
        ...a,
        availability: Object.fromEntries((availRaw || []).filter(av => av.attendee_id === a.id).map(av => [av.date, av.status]))
      }))
      const scored = bestDates(attendeesWithAvail, ev.start_date, ev.days_to_show, ev.duration) as any[]
      const top = scored[0]
      const dateStr = top ? (ev.duration > 1 ? `${fmtDate(top.startDate)}–${fmtDate(top.endDate)}` : fmtDate(top.date)) : ''

      await supabaseAdmin.from('ww_notifications').insert({
        event_id: att.event_id,
        type: 'all_filled',
        message: `🎉 All ${allAttendees?.length} attendees filled in! Best date: ${dateStr}`,
      })

      // Email organiser
      const { data: organiser } = await supabaseAdmin
        .from('ww_attendees').select('*').eq('event_id', att.event_id).eq('is_organiser', true).single()
      if (organiser) {
        sendOrganizerAllFilledEmail({
          toName: organiser.name,
          toEmail: organiser.email,
          eventTitle: ev.title,
          bestDate: dateStr,
          eventId: att.event_id,
        }).catch(console.error)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
