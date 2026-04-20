'use client'
import React, { useState } from 'react'
import { parseICS } from '@/lib/utils'

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'green'
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: 'sm' | 'xs' | 'md'
}
const variantClass: Record<BtnVariant, string> = {
  primary:   'bg-accent text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-px',
  secondary: 'bg-surface2 text-[var(--t)] border border-border hover:bg-surface3 hover:border-border2',
  ghost:     'bg-transparent text-muted border border-transparent hover:text-[var(--t)] hover:bg-surface2 hover:border-border',
  danger:    'bg-red/10 text-red border border-red/25 hover:bg-red/20',
  green:     'bg-green/10 text-green border border-green/25 hover:bg-green/20',
}
const sizeClass = { md: 'px-4 py-2 text-[13px]', sm: 'px-3 py-[5px] text-[12px]', xs: 'px-2 py-[3px] text-[11px]' }

export function Btn({ variant = 'secondary', size = 'md', className = '', children, ...props }: BtnProps) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-[7px] font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap font-sans disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-surface border border-border rounded-[10px] p-5 mb-3.5 ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold tracking-[1.4px] uppercase text-muted mb-2.5">
      {children}
    </div>
  )
}

// ── Chip ──────────────────────────────────────────────────────────────────────
type ChipColour = 'default' | 'green' | 'amber' | 'blue' | 'red'
const chipColour: Record<ChipColour, string> = {
  default: 'text-muted bg-surface2 border-border',
  green:   'text-green bg-green/[0.07] border-green/20',
  amber:   'text-amber bg-amber/[0.07] border-amber/20',
  blue:    'text-accent bg-accent/[0.07] border-accent/20',
  red:     'text-red bg-red/[0.07] border-red/20',
}
export function Chip({ children, colour = 'default' }: { children: React.ReactNode; colour?: ChipColour }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-[3px] rounded-[5px] border font-medium ${chipColour[colour]}`}>
      {children}
    </span>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, colour = 'default' }: { children: React.ReactNode; colour?: ChipColour }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-[3px] rounded-[5px] border whitespace-nowrap ${chipColour[colour]}`}>
      {children}
    </span>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string
  children: React.ReactNode
}
export function Field({ label, children }: FieldProps) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-semibold text-muted mb-1.5 tracking-[0.3px]">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full bg-surface2 border border-border rounded-[7px] px-3 py-[9px] text-[var(--t)] font-sans text-[13px] outline-none transition-colors focus:border-accent focus:bg-surface'

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${inputClass} resize-y min-h-[60px] leading-relaxed`} {...props} />
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={inputClass} {...props}>
      {children}
    </select>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, children }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_.15s_ease]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ animation: 'fadeIn .15s ease' }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        className="bg-surface border border-border rounded-xl p-6 w-full max-w-[500px] max-h-[92vh] overflow-y-auto"
        style={{ animation: 'slideUp .2s ease' }}
      >
        <h2 className="text-[17px] font-bold mb-1">{title}</h2>
        {subtitle && <p className="text-muted text-[13px] mb-5 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 justify-end mt-5 flex-wrap">{children}</div>
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ msg, icon, colour }: { msg: string; icon: string; colour?: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-border2 rounded-[7px] px-4 py-2.5 text-[13px] font-medium z-[300] shadow-2xl flex items-center gap-2 pointer-events-none whitespace-nowrap"
      style={{ animation: 'toastIn .2s ease' }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <span style={{ color: colour || 'var(--g)' }}>{icon}</span>
      {msg}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────
const COLOURS = ['#5b8ef0','#c084fc','#34d88a','#f59e0b','#f05b5b','#f472b6','#38bdf8','#a78bfa']
export const getColour = (name: string) => COLOURS[name.charCodeAt(0) % COLOURS.length]
export const getInitials = (name: string) => name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const col = getColour(name)
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0"
      style={{ width: size, height: size, background: `${col}22`, color: col, fontSize: size * 0.38 }}
    >
      {getInitials(name)}
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: {
  tabs: { key: string; label: React.ReactNode }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex gap-0.5 mb-5 bg-surface2 p-[3px] rounded-[7px] border border-border">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex-1 py-[7px] px-2 rounded-[5px] text-[12px] font-semibold text-center cursor-pointer border-none transition-all font-sans whitespace-nowrap ${active === t.key ? 'bg-surface text-[var(--t)] shadow-sm shadow-black/30' : 'bg-transparent text-muted'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Progress dots ─────────────────────────────────────────────────────────────
export function ProgressDots({ attendees }: { attendees: Array<{ name: string; availability: Record<string, string> }> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {attendees.map((a, i) => {
        const done = Object.keys(a.availability).length > 0
        const col = getColour(a.name)
        return (
          <div
            key={i}
            title={a.name}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-all"
            style={done
              ? { background: `${col}22`, borderColor: col, color: col }
              : { background: 'var(--s3)', borderColor: 'var(--b)', color: 'var(--m)' }
            }
          >
            {getInitials(a.name)}
          </div>
        )
      })}
    </div>
  )
}

// ── ICS Import Modal ──────────────────────────────────────────────────────────
const OTHER_CAL_SOURCES = [
  { icon: '🗓️', name: 'Google Calendar', hint: 'Settings (⚙) → Import & Export → Export', href: 'https://calendar.google.com/calendar/r/settings/export' },
  { icon: '📧', name: 'Outlook.com', hint: 'Settings (⚙) → View all → Export calendar', href: 'https://outlook.live.com/calendar/0/options/calendar/ConnectedCalendars' },
  { icon: '💼', name: 'Outlook Desktop', hint: 'File → Open & Export → Import/Export → Export to a file', href: null },
  { icon: '🍎', name: 'Mac Calendar', hint: 'File menu → Export → Export…', href: null },
]

export function ICSImportModal({ open, onClose, onImport }: {
  open: boolean
  onClose: () => void
  onImport: (busyDates: string[]) => void
}) {
  const [mode, setMode] = useState<'iphone' | 'other'>('iphone')
  const [webcalUrl, setWebcalUrl] = useState('')
  const [icsText, setIcsText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleWebcal = async () => {
    if (!webcalUrl.trim()) return
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/fetch-cal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webcalUrl.trim() }),
      })
      const json = await r.json()
      if (!r.ok) { setError(json.error || 'Could not fetch calendar.'); return }
      onImport(parseICS(json.ics))
      setWebcalUrl(''); onClose()
    } catch {
      setError('Something went wrong — try the Other tab instead.')
    } finally { setLoading(false) }
  }

  const handlePaste = () => {
    if (!icsText.trim()) return
    onImport(parseICS(icsText))
    setIcsText(''); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="📥 Import Calendar" subtitle="Pull in your busy dates to fill availability automatically.">
      {/* Tab switcher */}
      <div className="flex gap-0.5 mb-5 bg-surface2 p-[3px] rounded-[7px] border border-border">
        {([['iphone', '📱 iPhone / iCloud'], ['other', '🖥️ Other']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setMode(key); setError('') }}
            className={`flex-1 py-[7px] px-2 rounded-[5px] text-[12px] font-semibold cursor-pointer border-none font-sans transition-all ${mode === key ? 'bg-surface text-[var(--t)] shadow-sm shadow-black/10' : 'bg-transparent'}`}
            style={mode !== key ? { color: 'var(--m)' } : {}}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'iphone' && (
        <>
          <div className="bg-surface2 border border-border rounded-[8px] p-3.5 mb-4">
            <p className="text-[12px] font-semibold mb-2">Get your webcal link:</p>
            <ol className="text-[12px] leading-relaxed" style={{ color: 'var(--t2)', paddingLeft: '1.1em', listStyleType: 'decimal' }}>
              <li>Open the <strong>Calendar</strong> app</li>
              <li>Tap <strong>Calendars</strong> at the bottom</li>
              <li>Tap <strong>ⓘ</strong> next to the calendar you want to import</li>
              <li>Toggle on <strong>Public Calendar</strong></li>
              <li>Tap <strong>Share Link</strong> and copy it</li>
            </ol>
          </div>
          <Field label="Paste your webcal:// link here">
            <Input
              placeholder="webcal://p08-caldav.icloud.com/published/2/..."
              value={webcalUrl}
              onChange={e => { setWebcalUrl(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleWebcal()}
            />
          </Field>
          {error && <p className="text-red text-[12px] -mt-2 mb-3">{error}</p>}
          <ModalActions>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" disabled={!webcalUrl.trim() || loading} onClick={handleWebcal}>
              {loading ? 'Fetching…' : 'Import from Link'}
            </Btn>
          </ModalActions>
        </>
      )}

      {mode === 'other' && (
        <>
          <div className="grid grid-cols-1 gap-1.5 mb-4">
            {OTHER_CAL_SOURCES.map(s => {
              const inner = (
                <div className={`flex items-center gap-3 px-3 py-2.5 bg-surface2 border border-border rounded-[7px] transition-colors ${s.href ? 'hover:border-border2 hover:bg-surface3' : ''}`}
                  style={!s.href ? { opacity: 0.7 } : {}}>
                  <span className="text-[17px] flex-shrink-0">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold">{s.name}</div>
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--m)' }}>{s.hint}</div>
                  </div>
                  {s.href && <span className="text-[11px] text-accent font-semibold flex-shrink-0">Open →</span>}
                </div>
              )
              return s.href
                ? <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" className="block no-underline">{inner}</a>
                : <div key={s.name}>{inner}</div>
            })}
          </div>
          <Field label="Paste .ics file contents">
            <Textarea rows={5} placeholder={'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\n...'} value={icsText} onChange={e => setIcsText(e.target.value)} />
          </Field>
          <ModalActions>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" disabled={!icsText.trim()} onClick={handlePaste}>Import Busy Dates</Btn>
          </ModalActions>
        </>
      )}
    </Modal>
  )
}

// ── Notification item ─────────────────────────────────────────────────────────
const notifIcon: Record<string, string> = { all_filled: '🎉', nudge_sent: '📨', auto_nudge: '⚡', decided: '✅', info: 'ℹ️' }

export function NotifItem({ notif }: { notif: { type: string; message: string; read: boolean; created_at: string } }) {
  return (
    <div className={`flex items-start gap-2.5 p-3 bg-surface2 border rounded-[7px] mb-2 transition-colors ${!notif.read ? 'border-l-[3px] border-l-accent border-accent/20 bg-accent/[0.03]' : 'border-border'}`}>
      <span className="text-[17px] flex-shrink-0 mt-px">{notifIcon[notif.type] || 'ℹ️'}</span>
      <div className="flex-1">
        <div className="text-[13px] leading-relaxed">{notif.message}</div>
        <div className="text-[11px] text-muted mt-0.5">
          {new Date(notif.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}
