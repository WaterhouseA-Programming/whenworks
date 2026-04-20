import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { bestDates, fmtDate, makeICS, getDates } from '@/lib/utils'
import { sendDecidedEmail, sendOrganizerAllFilledEmail } from '@/lib/email'

async function getEnrichedEvent(id: string) {
  const { data: ev } = await supabaseAdmin.from('ww_events').select('*').eq('id', id).single()
  if (!ev) return null

  const [{ data: attendees }, { data: availability }, { data: notifications }] = await Promise.all([
    supabaseAdmin.from('ww_attendees').select('*').eq('event_id', id),
    supabaseAdmin.from('ww_availability').select('*').eq('event_id', id),
    supabaseAdmin.from('ww_notifications').select('*').eq('event_id', id).order('created_at', { ascending: false }),
  ])

  const attendeesWithAvail = (attendees || []).map((a) => ({
    ...a,
    availability: Object.fromEntries(
      (availability || []).filter(av => av.attendee_id === a.id).map(av => [av.date, av.status])
    ),
  }))

  return { ...ev, attendees: attendeesWithAvail, notifications: notifications || [] }
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const ev = await getEnrichedEvent(params.id)
  if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ev)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()

  // Finalise event
  if (body.action === 'decide') {
    const { decided_date, decided_note } = body
    const { error } = await supabaseAdmin.from('ww_events').update({ status: 'decided', decided_date, decided_note }).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Add notification
    await supabaseAdmin.from('ww_notifications').insert({ event_id: params.id, type: 'decided', message: `Date confirmed: ${fmtDate(decided_date)}. ${decided_note || ''}` })

    // Email all attendees
    const ev = await getEnrichedEvent(params.id)
    if (ev) {
      const icsContent = makeICS(ev.title, decided_date, decided_note || '')
      const dateStr = fmtDate(decided_date)
      await Promise.allSettled(
        ev.attendees.map((a: any) =>
          sendDecidedEmail({ toName: a.name, toEmail: a.email, eventTitle: ev.title, organiserName: ev.organiser_name, decidedDate: dateStr, decidedNote: decided_note || '', icsContent })
        )
      )
    }

    return NextResponse.json({ ok: true })
  }

  // General patch (title, description, etc.)
  const allowed = ['title','description','colour','start_date','days_to_show','duration','nudge_after','time_slots','hide_weekends']
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
  const { error } = await supabaseAdmin.from('ww_events').update(update).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin.from('ww_events').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
