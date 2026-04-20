'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Btn, Card, Chip, Label, Modal, ModalActions, Field, Input, Textarea, Select, Toast, getColour } from '@/components/ui'
import { fmtDate, bestDates, daysSince } from '@/lib/utils'
import type { EventFull } from '@/types'

const COLOURS = ['#5b8ef0','#c084fc','#34d88a','#f59e0b','#f05b5b','#f472b6','#38bdf8']
const TIME_SLOTS = [
  { key: 'morning', label: '🌅 Morning' },
  { key: 'afternoon', label: '☀️ Afternoon' },
  { key: 'evening', label: '🌙 Evening' },
  { key: 'allday', label: '📅 All Day' },
]

function todayStr() { return new Date().toISOString().split('T')[0] }

export default function Home() {
  const [events, setEvents] = useState<EventFull[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<{ msg: string; icon: string; colour?: string } | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', name: '', email: '',
    startDate: todayStr(), days: '14', duration: '1',
    nudgeAfter: '2', timeSlots: ['allday'], colour: '#5b8ef0',
  })

  const showToast = useCallback((msg: string, icon: string, colour?: string) => {
    setToast({ msg, icon, colour })
    setTimeout(() => setToast(null), 2800)
  }, [])

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/events')
      if (r.ok) setEvents(await r.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const setF = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  const toggleTS = (key: string) =>
    setF('timeSlots', form.timeSlots.includes(key)
      ? form.timeSlots.filter(k => k !== key)
      : [...form.timeSlots, key])

  const handleCreate = async () => {
    if (!form.title.trim() || !form.name.trim() || !form.email.trim()) {
      showToast('Please fill in required fields', '⚠', 'var(--am)'); return
    }
    setCreating(true)
    try {
      const r = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, description: form.description,
          organiser_name: form.name, organiser_email: form.email,
          colour: form.colour, start_date: form.startDate,
          days_to_show: parseInt(form.days), duration: parseInt(form.duration),
          nudge_after: parseInt(form.nudgeAfter),
          time_slots: form.timeSlots.length ? form.timeSlots : ['allday'],
        }),
      })
      if (r.ok) {
        const ev = await r.json()
        setEvents(p => [ev, ...p])
        setShowCreate(false)
        setForm({ title:'', description:'', name:'', email:'', startDate:todayStr(), days:'14', duration:'1', nudgeAfter:'2', timeSlots:['allday'], colour:'#5b8ef0' })
        showToast('Event created!', '🎉', 'var(--g)')
        window.location.href = `/e/${ev.id}?tab=attendees`
      } else {
        showToast('Failed to create event', '✗', 'var(--r)')
      }
    } finally { setCreating(false) }
  }

  return (
    <div className="max-w-[960px] mx-auto px-4 pb-24">
      {/* Nav */}
      <nav className="flex items-center justify-between py-4 border-b border-border mb-7 sticky top-0 bg-bg z-10">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#5b8ef0,#c084fc)' }}>📅</div>
          <span className="font-bold text-[18px] tracking-[-0.3px]">WhenWorks<span style={{ color: 'var(--m)' }} className="font-normal">.</span></span>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ New Event</Btn>
      </nav>

      {/* Hero */}
      <div className="mb-8 pt-1">
        <h1 className="text-[clamp(22px,4vw,34px)] font-bold mb-1.5 tracking-[-0.5px]">
          Find time that{' '}
          <span className="font-serif italic" style={{ fontSize: '1.05em', background: 'linear-gradient(135deg,#5b8ef0,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            works for everyone
          </span>
        </h1>
        <p className="text-[var(--t2)] text-[14px] max-w-[420px] leading-relaxed">
          Create a scheduling event, invite your people, and WhenWorks surfaces the perfect date automatically.
        </p>
      </div>

      {/* Events list */}
      <div className="flex justify-between items-center mb-3.5">
        <Label>Your Events ({events.length})</Label>
        <Btn variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ New</Btn>
      </div>

      {loading && (
        <div className="text-center py-16 text-muted text-[13px]">Loading…</div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-16">
          <div className="text-[36px] mb-3">📅</div>
          <h3 className="text-[17px] font-bold mb-1.5">No events yet</h3>
          <p className="text-muted text-[13px] max-w-[280px] mx-auto mb-5 leading-relaxed">
            Create your first scheduling event and invite people to find a time that works for everyone.
          </p>
          <Btn variant="primary" onClick={() => setShowCreate(true)}>Create your first event</Btn>
        </div>
      )}

      {!loading && events.map(ev => {
        const filled = ev.attendees.filter(a => Object.keys(a.availability).length > 0).length
        const pending = ev.attendees.length - filled
        const best = bestDates(ev.attendees, ev.start_date, ev.days_to_show, ev.duration) as any[]
        const topScore = best[0]?.score || 0
        const unread = ev.notifications.filter(n => !n.read).length
        const pct = Math.round(filled / Math.max(ev.attendees.length, 1) * 100)
        const isDone = ev.status === 'decided'

        return (
          <a key={ev.id} href={`/e/${ev.id}`} className="block no-underline">
            <div className="bg-surface border border-border rounded-[10px] px-5 py-[18px] mb-2.5 cursor-pointer transition-all hover:border-border2 hover:-translate-y-px hover:shadow-lg hover:shadow-black/20 relative overflow-hidden group">
              {/* Accent strip */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-[3px_0_0_3px] transition-opacity opacity-0 group-hover:opacity-100" style={{ background: ev.colour }} />

              <div className="flex justify-between items-start gap-2 mb-1.5">
                <div className="font-bold text-[15px] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.colour }} />
                  {ev.title}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {unread > 0 && (
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#5b8ef0' }}>{unread}</div>
                  )}
                  {isDone && <Chip colour="green">✓ Decided</Chip>}
                </div>
              </div>

              {ev.description && (
                <div className="text-[12px] text-muted mb-2 leading-relaxed overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                  {ev.description}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 items-center">
                <Chip>👤 {ev.organiser_name}</Chip>
                <Chip>{ev.attendees.length} people</Chip>
                {pending > 0 ? <Chip colour="amber">⏳ {pending} pending</Chip> : <Chip colour="green">✓ All filled</Chip>}
                {topScore > 0 && !isDone && <Chip colour="blue">🏆 {Math.round(topScore * 100)}% match</Chip>}
                {isDone && ev.decided_date && <Chip colour="green">📅 {fmtDate(ev.decided_date)}</Chip>}
                {ev.duration > 1 && <Chip colour="blue">{ev.duration} days needed</Chip>}
              </div>

              {/* Progress bar */}
              <div className="h-[2px] rounded-full bg-surface3 mt-2.5 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ev.colour }} />
              </div>
              <div className="text-[11px] text-muted mt-1">{filled}/{ev.attendees.length} filled · {fmtDate(ev.start_date)} · {ev.days_to_show}d window</div>
            </div>
          </a>
        )
      })}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Event" subtitle="Set up a scheduling event, define the date window, and invite your people.">
        <Field label="Event Name *"><Input placeholder="Team Offsite, Book Club, Family Reunion…" value={form.title} onChange={e => setF('title', e.target.value)} /></Field>
        <Field label="Description"><Textarea placeholder="Add some context about the event…" value={form.description} onChange={e => setF('description', e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <Field label="Your Name *"><Input placeholder="Alex" value={form.name} onChange={e => setF('name', e.target.value)} /></Field>
          <Field label="Your Email *"><Input type="email" placeholder="alex@example.com" value={form.email} onChange={e => setF('email', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <Field label="Start Date"><Input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} /></Field>
          <Field label="Days to Check">
            <Select value={form.days} onChange={e => setF('days', e.target.value)}>
              {[7,10,14,21,28].map(n => <option key={n} value={n}>{n} days</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <Field label="Duration Needed">
            <Select value={form.duration} onChange={e => setF('duration', e.target.value)}>
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'day' : 'consecutive days'}</option>)}
            </Select>
          </Field>
          <Field label="Auto-nudge After">
            <Select value={form.nudgeAfter} onChange={e => setF('nudgeAfter', e.target.value)}>
              <option value="0">Never</option>
              {[1,2,3,5,7].map(n => <option key={n} value={n}>{n} day{n > 1 ? 's' : ''}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Time of Day">
          <div className="flex gap-1.5 flex-wrap mt-0.5">
            {TIME_SLOTS.map(ts => (
              <button key={ts.key} onClick={() => toggleTS(ts.key)}
                className={`px-3 py-1.5 rounded-[5px] border text-[12px] font-semibold cursor-pointer transition-all font-sans ${form.timeSlots.includes(ts.key) ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface2 text-muted hover:border-border2 hover:text-[var(--t)]'}`}>
                {ts.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Accent Colour">
          <div className="flex gap-2 flex-wrap mt-1">
            {COLOURS.map(c => (
              <div key={c} onClick={() => setF('colour', c)}
                className="w-[22px] h-[22px] rounded-full cursor-pointer transition-all"
                style={{ background: c, border: form.colour === c ? '2px solid white' : '2px solid transparent', transform: form.colour === c ? 'scale(1.2)' : 'scale(1)' }} />
            ))}
          </div>
        </Field>
        <ModalActions>
          <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleCreate} disabled={creating}>{creating ? 'Creating…' : 'Create Event'}</Btn>
        </ModalActions>
      </Modal>

      {toast && <Toast {...toast} />}
    </div>
  )
}
