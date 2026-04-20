'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Btn, Card, Chip, Label, Modal, ModalActions, Field, Input, Textarea, Select,
  Toast, Avatar, Tabs, Badge, ProgressDots, NotifItem, getColour, CalendarSourceButtons,
} from '@/components/ui'
import { OverviewGrid, AvailPicker } from '@/components/AvailGrid'
import { bestDates, fmtDate, fmtLong, daysSince, makeICS, parseICS, getDates } from '@/lib/utils'
import type { EventFull, AvailStatus } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''
const TIME_SLOT_LABELS: Record<string, string> = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌙 Evening', allday: '📅 All Day' }
const TIME_SLOTS = [
  { key: 'morning', label: '🌅 Morning' },
  { key: 'afternoon', label: '☀️ Afternoon' },
  { key: 'evening', label: '🌙 Evening' },
  { key: 'allday', label: '📅 All Day' },
]

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const searchParams = useSearchParams()
  const [ev, setEv] = useState<EventFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview')
  const [activeAttId, setActiveAttId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; icon: string; colour?: string } | null>(null)

  // Modals
  const [showAdd, setShowAdd] = useState(false)
  const [showFinalise, setShowFinalise] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showICS, setShowICS] = useState(false)
  const [showDel, setShowDel] = useState(false)

  // Form state
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [finalDate, setFinalDate] = useState('')
  const [finalNote, setFinalNote] = useState('')
  const [icsText, setIcsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [localAvail, setLocalAvail] = useState<Record<string, AvailStatus>>({})

  // Settings state
  const [settings, setSettings] = useState({
    hide_weekends: false,
    nudge_after: 2,
    time_slots: ['allday'] as string[],
    start_date: '',
    days_to_show: 14,
    duration: 1,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const showToast = useCallback((msg: string, icon: string, colour?: string) => {
    setToast({ msg, icon, colour }); setTimeout(() => setToast(null), 2800)
  }, [])

  const load = useCallback(async () => {
    const r = await fetch(`/api/events/${eventId}`)
    if (r.ok) {
      const data = await r.json()
      setEv(data)
      if (!activeAttId) setActiveAttId(data.attendees[0]?.id || null)
      setLoading(false)
    }
  }, [eventId, activeAttId])

  useEffect(() => { load() }, [eventId])

  useEffect(() => {
    if (activeAttId && ev) {
      const att = ev.attendees.find(a => a.id === activeAttId)
      setLocalAvail(att?.availability || {})
    }
  }, [activeAttId, ev])

  // Sync settings state when event loads
  useEffect(() => {
    if (ev) {
      setSettings({
        hide_weekends: ev.hide_weekends ?? false,
        nudge_after: ev.nudge_after,
        time_slots: ev.time_slots,
        start_date: ev.start_date,
        days_to_show: ev.days_to_show,
        duration: ev.duration,
      })
    }
  }, [ev?.id])

  if (loading) return (
    <div className="max-w-[960px] mx-auto px-4 py-20 text-center text-[13px]" style={{ color: 'var(--m)' }}>Loading…</div>
  )
  if (!ev) return (
    <div className="max-w-[960px] mx-auto px-4 py-20 text-center">
      <h2 className="text-[20px] font-bold mb-2">Event not found</h2>
      <p className="text-[13px] mb-5" style={{ color: 'var(--m)' }}>This event may have been deleted.</p>
      <Btn variant="secondary" onClick={() => window.location.href = '/'}>← Back to events</Btn>
    </div>
  )

  const hideWeekends = ev.hide_weekends ?? false
  const best = bestDates(ev.attendees, ev.start_date, ev.days_to_show, ev.duration, hideWeekends) as any[]
  const unread = ev.notifications.filter(n => !n.read).length
  const filled = ev.attendees.filter(a => Object.keys(a.availability).length > 0).length
  const isMulti = ev.duration > 1
  const joinLink = `${APP_URL}/join/${ev.id}`

  const switchTab = async (t: string) => {
    setTab(t)
    if (t === 'notifications' && unread > 0) {
      await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: ev.id }) })
      setEv(p => p ? { ...p, notifications: p.notifications.map(n => ({ ...n, read: true })) } : p)
    }
  }

  const handleAdd = async () => {
    if (!addName.trim() || !addEmail.trim()) return
    const r = await fetch('/api/attendees', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: ev.id, name: addName, email: addEmail }),
    })
    if (r.ok) {
      const att = await r.json()
      setEv(p => p ? { ...p, attendees: [...p.attendees, att] } : p)
      setAddName(''); setAddEmail(''); setShowAdd(false)
      showToast(`${addName} added and invited!`, '👤', 'var(--a)')
    }
  }

  const handleNudge = async (attId: string) => {
    const att = ev.attendees.find(a => a.id === attId)
    const r = await fetch('/api/nudge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendee_id: attId }),
    })
    if (r.ok) { await load(); showToast(`Nudge sent to ${att?.name}!`, '📨', 'var(--a)') }
  }

  const handleSaveAvail = async () => {
    if (!activeAttId) return
    setSaving(true)
    const r = await fetch(`/api/attendees/${activeAttId}/availability`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: localAvail }),
    })
    if (r.ok) { await load(); showToast('Availability saved!', '✓', 'var(--g)') }
    setSaving(false)
  }

  const handleICS = () => {
    if (!icsText.trim() || !activeAttId) return
    const busy = parseICS(icsText)
    const dates = getDates(ev.start_date, ev.days_to_show)
    const updated = { ...localAvail }
    dates.forEach(d => { if (busy.includes(d)) updated[d] = 'busy'; else if (!updated[d]) updated[d] = 'free' })
    setLocalAvail(updated)
    setIcsText(''); setShowICS(false)
    showToast(`${busy.length} busy dates imported`, '📥', 'var(--a)')
  }

  const handleFinalise = async () => {
    const date = finalDate || best[0]?.date || best[0]?.startDate
    if (!date) { showToast('Please pick a date', '⚠', 'var(--am)'); return }
    const r = await fetch(`/api/events/${ev.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decide', decided_date: date, decided_note: finalNote }),
    })
    if (r.ok) { await load(); setShowFinalise(false); showToast(`Date confirmed: ${fmtDate(date)}`, '✅', 'var(--g)') }
  }

  const handleDelete = async () => {
    const r = await fetch(`/api/events/${ev.id}`, { method: 'DELETE' })
    if (r.ok) { window.location.href = '/' }
  }

  const downloadICS = () => {
    if (!ev.decided_date) return
    const content = makeICS(ev.title, ev.decided_date, ev.decided_note || '')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }))
    a.download = `${ev.title.replace(/[^a-z0-9]/gi, '_')}.ics`
    a.click()
    showToast('Calendar file downloaded!', '📥', 'var(--a)')
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    const r = await fetch(`/api/events/${ev.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (r.ok) { await load(); showToast('Settings saved!', '✓', 'var(--g)') }
    setSavingSettings(false)
  }

  const toggleTS = (key: string) =>
    setSettings(p => ({
      ...p,
      time_slots: p.time_slots.includes(key)
        ? p.time_slots.filter(k => k !== key)
        : [...p.time_slots, key],
    }))

  const tabItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'availability', label: 'My Avail.' },
    { key: 'attendees', label: 'Attendees' },
    { key: 'settings', label: 'Settings' },
    { key: 'notifications', label: <span>Alerts{unread > 0 && <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[9px] font-bold" style={{ background: '#5b8ef0' }}>{unread}</span>}</span> },
  ]

  return (
    <div className="max-w-[960px] mx-auto px-4 pb-24">
      {/* Nav */}
      <nav className="flex items-center justify-between py-4 border-b border-border mb-7 sticky top-0 bg-bg z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#5b8ef0,#c084fc)' }}>📅</div>
          <span className="font-bold text-[18px] tracking-[-0.3px]">WhenWorks<span style={{ color: 'var(--m)' }} className="font-normal">.</span></span>
        </div>
        <div className="flex gap-2">
          <Btn variant="primary" size="sm" onClick={() => setShowShare(true)}>🔗 Share Link</Btn>
          <Btn variant="secondary" size="sm" onClick={() => setShowAdd(true)}>+ Add</Btn>
        </div>
      </nav>

      {/* Event header */}
      <div className="flex items-start gap-2.5 mb-4">
        <Btn variant="ghost" size="sm" onClick={() => window.location.href = '/'}>← Back</Btn>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ev.colour }} />
            <h1 className="font-bold text-[clamp(15px,3.5vw,22px)]">{ev.title}</h1>
            {ev.status === 'decided' && <Chip colour="green">✓ Decided</Chip>}
          </div>
          <div className="text-[12px] mt-1" style={{ color: 'var(--m)' }}>
            By {ev.organiser_name} · {fmtDate(ev.start_date)} · {ev.days_to_show}d window
            {ev.duration > 1 && ` · ${ev.duration} consecutive days`}
            {hideWeekends && ' · weekdays only'}
          </div>
        </div>
        <Btn variant="danger" size="xs" onClick={() => setShowDel(true)}>Delete</Btn>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabItems} active={tab} onChange={switchTab} />

      {/* ── Overview Tab ── */}
      {tab === 'overview' && (
        <>
          <Card>
            <Label>What we're looking for</Label>
            <p className="text-[15px] font-bold mb-1">
              {ev.duration === 1 ? 'A single day' : `${ev.duration} consecutive days`}
            </p>
            <p className="text-[13px]" style={{ color: 'var(--t2)' }}>
              From {fmtDate(ev.start_date)}, across a {ev.days_to_show}-day window
              {ev.time_slots?.length > 0 && <span> · {ev.time_slots.map((s: string) => TIME_SLOT_LABELS[s] || s).join(', ')}</span>}
              {hideWeekends && <span> · weekdays only</span>}
            </p>
            {ev.description && (
              <p className="text-[12px] mt-2 leading-relaxed" style={{ color: 'var(--t2)' }}>{ev.description}</p>
            )}
          </Card>

          {ev.status === 'decided' && ev.decided_date && (
            <div className="bg-green/[0.08] border border-green/25 rounded-[10px] p-4 mb-3.5 flex items-center gap-3.5">
              <span className="text-[24px] flex-shrink-0">✅</span>
              <div className="flex-1">
                <h3 className="text-[15px] font-bold text-green mb-0.5">Date confirmed: {fmtLong(ev.decided_date)}</h3>
                {ev.decided_note && <p className="text-[12px]" style={{ color: 'var(--t2)' }}>{ev.decided_note}</p>}
                <div className="mt-2"><Btn variant="green" size="xs" onClick={downloadICS}>📥 Add to Calendar (.ics)</Btn></div>
              </div>
            </div>
          )}

          {best.length > 0 && best[0].score > 0 && (
            <Card>
              <Label>🏆 Best {isMulti ? 'Date Runs' : 'Dates'}</Label>
              <div className="flex flex-wrap mb-3">
                {best.filter(b => b.score > 0).slice(0, isMulti ? 4 : 6).map((b, i) => {
                  const lbl = isMulti ? `${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}` : fmtDate(b.date)
                  return (
                    <span key={i} className={`inline-flex items-center gap-1.5 border rounded-[6px] px-3 py-1.5 text-[12px] font-semibold m-1 ${i === 0 ? 'bg-green/15 border-green/40 text-green text-[13px]' : 'bg-green/[0.08] border-green/22 text-green'}`}>
                      {i === 0 && '⭐ '}{lbl}
                      <span className="opacity-60 text-[11px]">{b.free}/{b.total}</span>
                    </span>
                  )
                })}
              </div>
              {ev.status !== 'decided' && (
                <Btn variant="green" size="sm" onClick={() => { setFinalDate(best[0]?.date || best[0]?.startDate || ''); setShowFinalise(true) }}>
                  ✓ Finalise a Date
                </Btn>
              )}
            </Card>
          )}

          <Card>
            <Label>Availability Overview</Label>
            <OverviewGrid attendees={ev.attendees} startDate={ev.start_date} daysToShow={ev.days_to_show} hideWeekends={hideWeekends} />
          </Card>

          <Card>
            <Label>Completion</Label>
            <div className="flex items-center gap-2.5 flex-wrap">
              <ProgressDots attendees={ev.attendees} />
              <span className="text-[12px]" style={{ color: 'var(--m)' }}>{filled}/{ev.attendees.length} filled in</span>
            </div>
          </Card>
        </>
      )}

      {/* ── Availability Tab ── */}
      {tab === 'availability' && (
        <>
          <Card>
            <Label>Filling in as</Label>
            <div className="flex gap-1.5 flex-wrap">
              {ev.attendees.map(a => (
                <button key={a.id} onClick={() => setActiveAttId(a.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-semibold cursor-pointer border transition-all font-sans ${activeAttId === a.id ? 'text-white border-transparent' : 'bg-surface2 border-border hover:border-border2'}`}
                  style={activeAttId === a.id ? { background: getColour(a.name) } : { color: 'var(--m)' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: activeAttId === a.id ? 'rgba(255,255,255,0.7)' : getColour(a.name) }} />
                  {a.name}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
              <div>
                <Label>Your Availability</Label>
                <div className="text-[11px]" style={{ color: 'var(--m)' }}>Tap: Free → Maybe → Busy → Clear &nbsp;·&nbsp; Or drag across multiple days</div>
                {ev.time_slots?.length > 0 && (
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--m)' }}>Time slots: {ev.time_slots.map((s: string) => TIME_SLOT_LABELS[s] || s).join(', ')}</div>
                )}
              </div>
              <Btn variant="secondary" size="xs" onClick={() => setShowICS(true)}>📥 Import Calendar</Btn>
            </div>
            <AvailPicker startDate={ev.start_date} daysToShow={ev.days_to_show} initial={localAvail} onChange={setLocalAvail} hideWeekends={hideWeekends} />
            <div className="flex justify-end mt-4">
              <Btn variant="primary" onClick={handleSaveAvail} disabled={saving}>{saving ? 'Saving…' : 'Save Availability'}</Btn>
            </div>
          </Card>
        </>
      )}

      {/* ── Attendees Tab ── */}
      {tab === 'attendees' && (
        <>
          {best.length > 0 && best[0].score > 0 && (
            <div className="bg-green/[0.05] border border-green/18 rounded-[10px] p-4 mb-3.5 flex items-center gap-3">
              <span className="text-[22px]">🏆</span>
              <div className="flex-1">
                <div className="font-bold text-[14px] text-green">
                  Best date{isMulti ? ' run' : ''} so far: {isMulti ? `${fmtDate(best[0].startDate)} – ${fmtDate(best[0].endDate)}` : fmtDate(best[0].date)}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--t2)' }}>{best[0].free}/{best[0].total} respondents free{isMulti ? ' each day' : ''}</div>
              </div>
              {ev.status !== 'decided' && (
                <Btn variant="green" size="sm" onClick={() => { setFinalDate(best[0]?.date || best[0]?.startDate || ''); setShowFinalise(true) }}>Finalise</Btn>
              )}
            </div>
          )}

          <Card>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <Label>Attendees ({ev.attendees.length})</Label>
              <div className="flex gap-2">
                <Btn variant="primary" size="sm" onClick={() => setShowShare(true)}>🔗 Share Link</Btn>
                <Btn variant="secondary" size="sm" onClick={() => setShowAdd(true)}>+ Add Person</Btn>
              </div>
            </div>

            {ev.attendees.map(a => {
              const hasFilled = Object.keys(a.availability).length > 0
              const nd = a.nudged_at ? daysSince(a.nudged_at) : null
              const jd = daysSince(a.joined_at)
              const isOverdue = ev.nudge_after > 0 && !hasFilled && !a.nudged_at && jd >= ev.nudge_after
              return (
                <div key={a.id} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-b-0">
                  <Avatar name={a.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold flex items-center gap-1.5">
                      {a.name}
                      {a.is_organiser && <span className="text-[10px] text-accent font-medium">organiser</span>}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--m)' }}>{a.email} · Joined {jd === 0 ? 'today' : `${jd}d ago`}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {hasFilled ? <Badge colour="green">✓ Filled</Badge>
                      : a.nudged_at ? <Badge colour="blue">Nudged {nd === 0 ? 'today' : `${nd}d ago`}</Badge>
                      : isOverdue ? <Badge colour="red">⚠ Overdue</Badge>
                      : <Badge colour="amber">Pending</Badge>}
                    {!hasFilled && !a.is_organiser && (
                      <Btn variant="ghost" size="xs" onClick={() => handleNudge(a.id)}>📨 Nudge</Btn>
                    )}
                  </div>
                </div>
              )
            })}

            {ev.nudge_after > 0 && (
              <div className="text-[11px] mt-3 px-3 py-2 bg-surface2 rounded-[6px] border border-border" style={{ color: 'var(--m)' }}>
                ⚡ Auto-nudge: attendees flagged after {ev.nudge_after} day{ev.nudge_after > 1 ? 's' : ''} without filling in.
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── Settings Tab ── */}
      {tab === 'settings' && (
        <>
          <Card>
            <Label>Scheduling</Label>

            {/* Weekends toggle */}
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">Include weekends</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--m)' }}>
                  When off, Sat &amp; Sun are hidden from the grid and excluded from scoring
                </div>
              </div>
              <button
                onClick={() => setSettings(p => ({ ...p, hide_weekends: !p.hide_weekends }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 border-none cursor-pointer ${!settings.hide_weekends ? 'bg-accent' : 'bg-surface3'}`}
                style={{ outline: 'none' }}
              >
                <span className="absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform"
                  style={{ left: !settings.hide_weekends ? 'calc(100% - 21px)' : '3px' }} />
              </button>
            </div>

            {/* Duration */}
            <div className="flex items-start justify-between gap-4 py-3 border-b border-border flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">Duration needed</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--m)' }}>How many consecutive days are required</div>
              </div>
              <Select value={settings.duration} onChange={e => setSettings(p => ({ ...p, duration: parseInt(e.target.value) }))}>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'}</option>)}
              </Select>
            </div>

            {/* Date window — label above inputs so they don't crowd on small screens */}
            <div className="py-3 border-b border-border">
              <div className="text-[13px] font-semibold mb-0.5">Date window</div>
              <div className="text-[11px] mb-2.5" style={{ color: 'var(--m)' }}>Start date and how many days to show</div>
              <div className="flex gap-2 flex-wrap">
                <Input type="date" value={settings.start_date} onChange={e => setSettings(p => ({ ...p, start_date: e.target.value }))} />
                <Select value={settings.days_to_show} onChange={e => setSettings(p => ({ ...p, days_to_show: parseInt(e.target.value) }))}>
                  {[7,10,14,21,28].map(n => <option key={n} value={n}>{n} days</option>)}
                </Select>
              </div>
            </div>

            {/* Auto-nudge */}
            <div className="flex items-start justify-between gap-4 py-3 border-b border-border flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">Auto-nudge after</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--m)' }}>Flag attendees who haven't filled in after this many days</div>
              </div>
              <Select value={settings.nudge_after} onChange={e => setSettings(p => ({ ...p, nudge_after: parseInt(e.target.value) }))}>
                <option value="0">Never</option>
                {[1,2,3,5,7].map(n => <option key={n} value={n}>{n} day{n > 1 ? 's' : ''}</option>)}
              </Select>
            </div>

            {/* Time of day — only relevant for single-day events */}
            {settings.duration === 1 && (
              <div className="py-3">
                <div className="text-[13px] font-semibold mb-0.5">Time of day preference</div>
                <div className="text-[11px] mb-2.5" style={{ color: 'var(--m)' }}>Let attendees know what part of the day you have in mind</div>
                <div className="flex gap-1.5 flex-wrap">
                  {TIME_SLOTS.map(ts => (
                    <button key={ts.key} onClick={() => toggleTS(ts.key)}
                      className={`px-3 py-1.5 rounded-[5px] border text-[12px] font-semibold cursor-pointer transition-all font-sans ${settings.time_slots.includes(ts.key) ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface2 hover:border-border2'}`}
                      style={settings.time_slots.includes(ts.key) ? {} : { color: 'var(--t)' }}>
                      {ts.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="flex justify-end">
            <Btn variant="primary" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving…' : 'Save Settings'}
            </Btn>
          </div>
        </>
      )}

      {/* ── Notifications Tab ── */}
      {tab === 'notifications' && (
        ev.notifications.length === 0
          ? <div className="text-center py-16">
              <div className="text-[36px] mb-3">🔔</div>
              <h3 className="font-bold text-[17px] mb-1.5">No notifications yet</h3>
              <p className="text-[13px] max-w-[280px] mx-auto leading-relaxed" style={{ color: 'var(--m)' }}>You'll be notified when everyone fills in, when nudges are sent, or when a date is confirmed.</p>
            </div>
          : <div>{ev.notifications.map(n => <NotifItem key={n.id} notif={n} />)}</div>
      )}

      {/* ── Add Attendee Modal ── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Attendee" subtitle="They'll receive an email with a unique link to fill in their availability.">
        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <Field label="Name"><Input placeholder="Jordan" value={addName} onChange={e => setAddName(e.target.value)} /></Field>
          <Field label="Email"><Input type="email" placeholder="jordan@example.com" value={addEmail} onChange={e => setAddEmail(e.target.value)} /></Field>
        </div>
        <ModalActions>
          <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={!addName || !addEmail} onClick={handleAdd}>Add & Send Invite</Btn>
        </ModalActions>
      </Modal>

      {/* ── Finalise Modal ── */}
      <Modal open={showFinalise} onClose={() => setShowFinalise(false)} title="Finalise a Date" subtitle="Lock in the chosen date and notify all attendees with a calendar invite.">
        {best.filter(b => b.score > 0).slice(0, 5).map((b, i) => {
          const dateVal = isMulti ? b.startDate : b.date
          const lbl = isMulti ? `${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}` : fmtDate(b.date)
          return (
            <div key={i} onClick={() => setFinalDate(dateVal)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[7px] border mb-2 cursor-pointer transition-all ${finalDate === dateVal ? 'border-accent bg-accent/[0.08]' : 'border-border bg-surface2 hover:border-border2'}`}>
              <input type="radio" name="fd" readOnly checked={finalDate === dateVal} />
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{lbl}</div>
                <div className="text-[11px]" style={{ color: 'var(--m)' }}>{b.free}/{b.total} free{isMulti ? ' each day' : ''}</div>
              </div>
              {i === 0 && <span className="text-[11px] text-green font-semibold">Best</span>}
            </div>
          )
        })}
        <Field label="Or enter a custom date"><Input type="date" value={finalDate} onChange={e => setFinalDate(e.target.value)} /></Field>
        <Field label="Note to attendees (optional)"><Textarea placeholder="See you there! Venue details to follow…" value={finalNote} onChange={e => setFinalNote(e.target.value)} /></Field>
        <ModalActions>
          <Btn variant="ghost" onClick={() => setShowFinalise(false)}>Cancel</Btn>
          <Btn variant="green" onClick={handleFinalise}>✓ Confirm Date</Btn>
        </ModalActions>
      </Modal>

      {/* ── ICS Import Modal ── */}
      <Modal open={showICS} onClose={() => setShowICS(false)} title="📥 Import Calendar" subtitle="Open your calendar app, export as .ics, then paste the file contents below.">
        <CalendarSourceButtons />
        <Field label="Paste .ics file contents">
          <Textarea rows={5} placeholder={'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n...'} value={icsText} onChange={e => setIcsText(e.target.value)} />
        </Field>
        <ModalActions>
          <Btn variant="ghost" onClick={() => setShowICS(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={!icsText.trim()} onClick={handleICS}>Import Busy Dates</Btn>
        </ModalActions>
      </Modal>

      {/* ── Share Modal ── */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="🔗 Share Invite Link" subtitle="Anyone with this link can enter their details and add their availability — no email invite needed.">
        <Label>Invite link</Label>
        <div className="bg-surface2 border border-border rounded-[7px] px-3 py-2.5 flex items-center gap-2.5 mb-3">
          <code className="flex-1 text-[12px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: 'var(--t2)' }}>{joinLink}</code>
          <Btn variant="primary" size="xs" onClick={() => { navigator.clipboard?.writeText(joinLink); showToast('Link copied!', '🔗', 'var(--a)') }}>Copy</Btn>
        </div>
        <p className="text-[12px] leading-relaxed mb-4" style={{ color: 'var(--m)' }}>
          Share via WhatsApp, email, or text. Recipients enter their own name and email and land straight in the availability picker.
        </p>
        <div className="border-t border-border pt-4">
          <p className="text-[11px] font-semibold mb-1">Want to invite someone directly by email?</p>
          <p className="text-[12px] leading-relaxed" style={{ color: 'var(--m)' }}>Use "+ Add" to enter their details and they'll get a personalised email with their unique link.</p>
        </div>
        <ModalActions><Btn variant="ghost" onClick={() => setShowShare(false)}>Done</Btn></ModalActions>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal open={showDel} onClose={() => setShowDel(false)} title="Delete event?" subtitle="This permanently removes the event and all availability data. This cannot be undone.">
        <ModalActions>
          <Btn variant="ghost" onClick={() => setShowDel(false)}>Cancel</Btn>
          <Btn variant="danger" onClick={handleDelete}>Delete Event</Btn>
        </ModalActions>
      </Modal>

      {toast && <Toast {...toast} />}
    </div>
  )
}
