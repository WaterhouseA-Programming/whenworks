import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const { event_id } = await req.json()
  if (!event_id) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })

  await supabaseAdmin
    .from('ww_notifications')
    .update({ read: true })
    .eq('event_id', event_id)

  return NextResponse.json({ ok: true })
}
