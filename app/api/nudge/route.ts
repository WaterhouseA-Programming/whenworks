import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNudgeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const { attendee_id } = await req.json()
  if (!attendee_id) return NextResponse.json({ error: 'Missing attendee_id' }, { status: 400 })

  const { data: att } = await supabaseAdmin
    .from('ww_attendees')
    .select('*, ww_events(*)')
    .eq('id', attendee_id)
    .single()

  if (!att) return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })

  const ev = att.ww_events as any

  // Mark nudged
  await supabaseAdmin.from('ww_attendees').update({ nudged_at: new Date().toISOString() }).eq('id', attendee_id)

  // Add notification
  await supabaseAdmin.from('ww_notifications').insert({
    event_id: att.event_id,
    type: 'nudge_sent',
    message: `Nudge sent to ${att.name}.`,
  })

  // Send email
  await sendNudgeEmail({
    toName: att.name,
    toEmail: att.email,
    eventTitle: ev.title,
    organiserName: ev.organiser_name,
    token: att.token,
  }).catch(console.error)

  return NextResponse.json({ ok: true })
}
