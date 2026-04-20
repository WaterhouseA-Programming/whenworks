import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { url } = await req.json()
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  const httpsUrl = url.trim().replace(/^webcal:\/\//i, 'https://')

  let parsed: URL
  try {
    parsed = new URL(httpsUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Only allow iCloud domains (prevents SSRF to internal services)
  if (!parsed.hostname.endsWith('.icloud.com') && parsed.hostname !== 'icloud.com') {
    return NextResponse.json({ error: 'Only iCloud calendar links (webcal://) are supported here' }, { status: 400 })
  }

  try {
    const r = await fetch(httpsUrl, { headers: { Accept: 'text/calendar' } })
    if (!r.ok) {
      return NextResponse.json({ error: 'Could not fetch calendar — check the link is still public' }, { status: 502 })
    }
    const ics = await r.text()
    if (!ics.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json({ error: 'Link does not appear to be a valid calendar' }, { status: 422 })
    }
    return NextResponse.json({ ics })
  } catch {
    return NextResponse.json({ error: 'Failed to reach iCloud' }, { status: 502 })
  }
}
