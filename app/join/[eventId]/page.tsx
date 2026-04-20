'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Btn, Card, Field, Input, Label } from '@/components/ui'
import { fmtDate } from '@/lib/utils'

const TIME_SLOT_LABELS: Record<string, string> = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌙 Evening', allday: '📅 All Day' }

export default function JoinPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [ev, setEv] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setEv(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [eventId])

  const handleJoin = async () => {
    if (!name.trim() || !email.trim()) { setError('Please fill in both fields.'); return }
    setJoining(true); setError('')
    const r = await fetch('/api/attendees', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, name: name.trim(), email: email.trim() }),
    })
    if (r.ok) {
      const att = await r.json()
      window.location.href = `/attend/${att.token}`
    } else {
      setError('Something went wrong — please try again.')
      setJoining(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>
  )

  if (!ev) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-[40px] mb-4">🔗</div>
        <h2 className="text-[20px] font-bold mb-2">Event not found</h2>
        <p className="text-[var(--m)] text-[13px] leading-relaxed">This invite link may have expired or been removed.</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-[480px] mx-auto px-4 pb-24 pt-10">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#5b8ef0,#c084fc)' }}>📅</div>
        <span className="font-bold text-[18px] tracking-[-0.3px]">WhenWorks<span style={{ color: 'var(--m)' }} className="font-normal">.</span></span>
      </div>

      {/* Event info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ev.colour }} />
          <h1 className="font-bold text-[clamp(18px,4vw,24px)]">{ev.title}</h1>
        </div>
        <p style={{ color: 'var(--m)' }} className="text-[13px]">
          Organised by {ev.organiser_name} · {fmtDate(ev.start_date)} · {ev.days_to_show}-day window
          {ev.duration > 1 && ` · ${ev.duration} consecutive days`}
        </p>
        {ev.time_slots?.length > 0 && (
          <p style={{ color: 'var(--t2)' }} className="text-[12px] mt-0.5">
            ⏰ {ev.time_slots.map((s: string) => TIME_SLOT_LABELS[s] || s).join(' · ')}
          </p>
        )}
        {ev.description && (
          <p style={{ color: 'var(--t2)' }} className="text-[13px] mt-2 leading-relaxed">{ev.description}</p>
        )}
      </div>

      <Card>
        <Label>Your details</Label>
        <p style={{ color: 'var(--t2)' }} className="text-[13px] mb-4 leading-relaxed">
          Enter your name and email to join and add your availability. {ev.organiser_name} is trying to find a time that works for everyone.
        </p>
        <Field label="Your Name">
          <Input
            placeholder="Alex"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </Field>
        <Field label="Your Email">
          <Input
            type="email"
            placeholder="alex@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </Field>
        {error && <p className="text-red text-[12px] mb-3">{error}</p>}
        <Btn variant="primary" className="w-full justify-center mt-1" onClick={handleJoin} disabled={joining}>
          {joining ? 'Joining…' : 'Join & Add My Availability →'}
        </Btn>
      </Card>

      <p style={{ color: 'var(--m)' }} className="text-[11px] text-center mt-4 leading-relaxed">
        You'll receive a confirmation email with your personal link so you can update your availability later.
      </p>
    </div>
  )
}
