'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Btn, Card, Label, Field, Textarea, Modal, ModalActions, Toast, Avatar } from '@/components/ui'
import { AvailPicker } from '@/components/AvailGrid'
import { fmtDate, fmtLong, parseICS, getDates } from '@/lib/utils'
import type { EventFull, AttendeeWithAvail, AvailStatus } from '@/types'

const TIME_SLOT_LABELS: Record<string, string> = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', evening: '🌙 Evening', allday: '📅 All Day' }

export default function AttendPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<{ event: EventFull; attendee: AttendeeWithAvail } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [avail, setAvail] = useState<Record<string, AvailStatus>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showICS, setShowICS] = useState(false)
  const [icsText, setIcsText] = useState('')
  const [toast, setToast] = useState<{ msg: string; icon: string; colour?: string } | null>(null)

  const showToast = useCallback((msg: string, icon: string, colour?: string) => {
    setToast({ msg, icon, colour }); setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => {
    fetch(`/api/attend/${token}`)
      .then(r => { if (!r.ok) { setNotFound(true); setLoading(false); return null } return r.json() })
      .then(d => { if (d) { setData(d); setAvail(d.attendee.availability || {}); setLoading(false) } })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    const r = await fetch(`/api/attendees/${data.attendee.id}/availability`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability: avail }),
    })
    if (r.ok) { setSaved(true); showToast("Availability saved — thanks!", '✓', 'var(--g)') }
    setSaving(false)
  }

  const handleICS = () => {
    if (!icsText.trim() || !data) return
    const busy = parseICS(icsText)
    const dates = getDates(data.event.start_date, data.event.days_to_show)
    const updated = { ...avail }
    dates.forEach(d => { if (busy.includes(d)) updated[d] = 'busy'; else if (!updated[d]) updated[d] = 'free' })
    setAvail(updated)
    setIcsText(''); setShowICS(false)
    showToast(`${busy.length} busy dates imported`, '📥', 'var(--a)')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-muted text-[13px]">Loading…</div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-[40px] mb-4">🔗</div>
        <h2 className="text-[20px] font-bold mb-2">Link not found</h2>
        <p className="text-muted text-[13px] leading-relaxed">This invite link may have expired or been removed. Ask the organiser for a new link.</p>
      </div>
    </div>
  )

  if (!data) return null
  const { event: ev, attendee: att } = data
  const isDone = ev.status === 'decided'

  return (
    <div className="max-w-[680px] mx-auto px-4 pb-24 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg,#5b8ef0,#c084fc)' }}>📅</div>
        <span className="font-bold text-[18px] tracking-[-0.3px]">WhenWorks<span className="text-muted font-normal">.</span></span>
      </div>

      {/* Event info */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ev.colour }} />
          <h1 className="font-bold text-[clamp(18px,4vw,26px)]">{ev.title}</h1>
        </div>
        <p className="text-muted text-[13px]">
          Organised by {ev.organiser_name} · {fmtDate(ev.start_date)} · {ev.days_to_show}d window
        </p>
        {ev.description && (
          <p className="text-[var(--t2)] text-[13px] mt-2 leading-relaxed">{ev.description}</p>
        )}
      </div>

      {/* Personal greeting */}
      <Card>
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={att.name} size={40} />
          <div>
            <div className="font-bold text-[15px]">Hi {att.name.split(' ')[0]}! 👋</div>
            <div className="text-[12px] text-muted">
              {ev.organiser_name} wants to know when you're free for <strong>{ev.title}</strong>.
            </div>
          </div>
        </div>
        {ev.time_slots?.length > 0 && (
          <div className="text-[12px] text-muted">
            ⏰ Time preference: {ev.time_slots.map(s => TIME_SLOT_LABELS[s] || s).join(' · ')}
          </div>
        )}
        {ev.duration > 1 && (
          <div className="text-[12px] text-muted mt-0.5">
            📅 They need {ev.duration} consecutive days
          </div>
        )}
      </Card>

      {/* Decided banner */}
      {isDone && ev.decided_date && (
        <div className="bg-green/[0.08] border border-green/25 rounded-[10px] p-4 mb-3.5 flex items-start gap-3">
          <span className="text-[22px]">✅</span>
          <div>
            <div className="font-bold text-[14px] text-green mb-0.5">Date confirmed!</div>
            <div className="text-[13px] text-[var(--t2)]">{fmtLong(ev.decided_date)}</div>
            {ev.decided_note && <div className="text-[12px] text-muted mt-1">{ev.decided_note}</div>}
          </div>
        </div>
      )}

      {/* Saved confirmation */}
      {saved && (
        <div className="bg-green/[0.08] border border-green/25 rounded-[10px] p-4 mb-3.5 flex items-start gap-3">
          <span className="text-[22px]">🎉</span>
          <div>
            <div className="font-bold text-[14px] text-green mb-0.5">All saved!</div>
            <div className="text-[12px] text-muted">Your availability has been shared with {ev.organiser_name}. We'll let you know once a date is confirmed.</div>
          </div>
        </div>
      )}

      {/* Availability picker */}
      <Card>
        <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
          <div>
            <Label>Your Availability</Label>
            <div className="text-[11px] text-muted">Mark each date — tap to cycle Free → Maybe → Busy → Clear</div>
          </div>
          <Btn variant="secondary" size="xs" onClick={() => setShowICS(true)}>📥 Import Calendar</Btn>
        </div>

        <AvailPicker
          startDate={ev.start_date}
          daysToShow={ev.days_to_show}
          initial={avail}
          onChange={setAvail}
        />

        <div className="flex justify-end mt-4">
          <Btn variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Update Availability' : 'Save Availability'}
          </Btn>
        </div>
      </Card>

      {/* Who else is attending */}
      <Card>
        <Label>Who's filling this in</Label>
        <div className="flex flex-wrap gap-2">
          {ev.attendees.map(a => {
            const hasFilled = Object.keys(a.availability).length > 0
            const isMe = a.id === att.id
            return (
              <div key={a.id} className="flex items-center gap-1.5">
                <Avatar name={a.name} size={26} />
                <span className={`text-[12px] ${isMe ? 'font-semibold' : 'text-muted'}`}>{a.name}{isMe ? ' (you)' : ''}</span>
                {hasFilled && <span className="text-green text-[11px]">✓</span>}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ICS Import Modal */}
      <Modal open={showICS} onClose={() => setShowICS(false)} title="📥 Import Calendar" subtitle="Export your calendar as an .ics file and paste the contents below to auto-mark your busy dates.">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {['🍎 iPhone: Calendar → tap calendar name → Export Calendar', '🤖 Google: calendar.google.com → Settings → Export', '📆 Outlook: File → Open & Export → Export to iCalendar'].map(s => (
            <div key={s} className="px-2.5 py-1.5 bg-surface3 border border-border rounded-[7px] text-[11px] text-[var(--t2)]">{s}</div>
          ))}
        </div>
        <Field label="Paste .ics file contents">
          <Textarea rows={6} placeholder={'BEGIN:VCALENDAR\nVERSION:2.0\n...'} value={icsText} onChange={e => setIcsText(e.target.value)} />
        </Field>
        <ModalActions>
          <Btn variant="ghost" onClick={() => setShowICS(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={!icsText.trim()} onClick={handleICS}>Import Busy Dates</Btn>
        </ModalActions>
      </Modal>

      {toast && <Toast {...toast} />}
    </div>
  )
}
