'use client'
import React, { useState, useEffect, useRef } from 'react'
import { getDates, fmtShort, fmtDay, fmtMon, isWeekend, getColour } from '@/lib/utils'
import type { AttendeeWithAvail, AvailStatus } from '@/types'

// ── Read-only overview grid ───────────────────────────────────────────────────
export function OverviewGrid({
  attendees,
  startDate,
  daysToShow,
  hideWeekends = false,
}: {
  attendees: AttendeeWithAvail[]
  startDate: string
  daysToShow: number
  hideWeekends?: boolean
}) {
  const allDates = getDates(startDate, daysToShow)
  const dates = hideWeekends ? allDates.filter(d => !isWeekend(d)) : allDates
  const n = attendees.length
  const CHUNK = 14
  const chunks: string[][] = []
  for (let i = 0; i < dates.length; i += CHUNK) chunks.push(dates.slice(i, i + CHUNK))

  const scoreDate = (date: string) => {
    let free = 0, total = 0
    for (const a of attendees) {
      const v = a.availability[date]
      if (v !== undefined) { total++; if (v === 'free') free++ }
    }
    return { free, total, score: total > 0 ? free / total : 0 }
  }

  return (
    <div className="overflow-x-auto -webkit-overflow-scrolling-touch pb-1">
      {chunks.map((chunk, ci) => (
        <div key={ci} style={{ minWidth: 'max-content', marginBottom: ci < chunks.length - 1 ? 20 : 0 }}>
          {/* Header row */}
          <div className="flex gap-[3px] mb-[3px]">
            <div style={{ width: 78, flexShrink: 0 }} />
            {chunk.map(d => (
              <div key={d} style={{ width: 38 }} className={`text-center text-[10px] text-muted font-semibold ${isWeekend(d) ? 'opacity-40' : ''}`}>
                <div>{fmtShort(d)}</div>
                <div className="text-[9px] opacity-50 mt-px">{fmtDay(d)}</div>
              </div>
            ))}
          </div>

          {/* Attendee rows */}
          {attendees.map(att => (
            <div key={att.id} className="flex gap-[3px] mb-[3px] items-center">
              <div style={{ width: 78 }} className="flex items-center gap-1.5 flex-shrink-0 overflow-hidden">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: getColour(att.name), flexShrink: 0 }} />
                <span className="text-[11px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">{att.name}</span>
              </div>
              {chunk.map(d => {
                const v = att.availability[d] as AvailStatus | undefined
                return (
                  <div key={d} className={`ac lk ${v || ''} ${isWeekend(d) ? 'weekend' : ''}`} style={{ width: 38, height: 30 }}>
                    {v === 'free' ? '✓' : v === 'busy' ? '✗' : v === 'maybe' ? '~' : ''}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Score row */}
          <div className="flex gap-[3px] items-center mt-1">
            <div style={{ width: 78 }} className="text-[8px] font-bold tracking-[1.2px] uppercase text-muted flex-shrink-0">SCORE</div>
            {chunk.map(d => {
              const { free, total, score } = scoreDate(d)
              const cls = score >= 0.7 ? 'sf' : score >= 0.35 ? 'sp' : 'sn'
              return (
                <div key={d} className={`ac lk sm ${cls}`} style={{ width: 38 }}>
                  {total > 0 ? free : ''}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mt-2.5">
        {(['free', 'busy', 'maybe'] as AvailStatus[]).map(v => (
          <div key={v} className="flex items-center gap-1 text-[11px] text-muted font-medium">
            <div className={`ac lk ${v}`} style={{ width: 14, height: 14, fontSize: 7, borderRadius: 3 }} />
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Editable availability picker ──────────────────────────────────────────────
export function AvailPicker({
  startDate,
  daysToShow,
  initial = {},
  onChange,
}: {
  startDate: string
  daysToShow: number
  initial?: Record<string, AvailStatus>
  onChange?: (avail: Record<string, AvailStatus>) => void
}) {
  const [avail, setAvail] = useState<Record<string, AvailStatus>>(initial)
  const drag = useRef<AvailStatus | 'clr' | null>(null)

  useEffect(() => { setAvail(initial) }, [JSON.stringify(initial)])

  const update = (d: string, v: AvailStatus | undefined) => {
    setAvail(prev => {
      const next = { ...prev }
      if (v === undefined) delete next[d]
      else next[d] = v
      onChange?.(next)
      return next
    })
  }

  const cycle = (d: string) => {
    const c = avail[d]
    const n = c === undefined ? 'free' : c === 'free' ? 'maybe' : c === 'maybe' ? 'busy' : undefined
    update(d, n)
  }

  const applyDrag = (d: string) => {
    if (!drag.current) return
    if (drag.current === 'clr') update(d, undefined)
    else update(d, drag.current)
  }

  const setAll = (v: AvailStatus | null) => {
    const dates = getDates(startDate, daysToShow)
    const next: Record<string, AvailStatus> = {}
    if (v !== null) dates.forEach(d => { next[d] = v })
    setAvail(next)
    onChange?.(next)
  }

  const dates = getDates(startDate, daysToShow)
  const CHUNK = 14
  const chunks: string[][] = []
  for (let i = 0; i < dates.length; i += CHUNK) chunks.push(dates.slice(i, i + CHUNK))

  return (
    <div>
      {/* Quick-fill buttons */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <button onClick={() => setAll('free')} className="text-[11px] px-2 py-1 rounded-[5px] bg-surface2 border border-border text-green font-semibold cursor-pointer font-sans hover:bg-surface3 transition-colors">All Free</button>
        <button onClick={() => setAll('busy')} className="text-[11px] px-2 py-1 rounded-[5px] bg-surface2 border border-border text-red font-semibold cursor-pointer font-sans hover:bg-surface3 transition-colors">All Busy</button>
        <button onClick={() => setAll(null)} className="text-[11px] px-2 py-1 rounded-[5px] bg-surface2 border border-border text-muted font-semibold cursor-pointer font-sans hover:bg-surface3 transition-colors">Clear</button>
      </div>

      <div className="overflow-x-auto -webkit-overflow-scrolling-touch" style={{ userSelect: 'none' }}
        onMouseLeave={() => { drag.current = null }}
        onMouseUp={() => { drag.current = null }}
      >
        {chunks.map((chunk, ci) => (
          <div key={ci} style={{ minWidth: 'max-content', marginBottom: ci < chunks.length - 1 ? 18 : 0 }}>
            <div className="flex gap-1 mb-1.5">
              {chunk.map(d => (
                <div key={d} style={{ width: 38 }} className={`text-center text-[10px] text-muted font-semibold ${isWeekend(d) ? 'opacity-40' : ''}`}>
                  <div>{fmtShort(d)}</div>
                  <div className="text-[9px] opacity-50 mt-px">{fmtDay(d)}/{fmtMon(d)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              {chunk.map(d => {
                const v = avail[d]
                return (
                  <div
                    key={d}
                    className={`ac ${v || ''} ${isWeekend(d) ? 'weekend' : ''}`}
                    style={{ width: 38 }}
                    onClick={() => cycle(d)}
                    onMouseDown={() => {
                      const c = avail[d]
                      drag.current = c === 'busy' ? 'clr' : c === undefined ? 'free' : c === 'free' ? 'maybe' : 'busy'
                    }}
                    onMouseEnter={() => applyDrag(d)}
                  >
                    {v === 'free' ? '✓' : v === 'busy' ? '✗' : v === 'maybe' ? '~' : ''}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap mt-2.5">
        <div className="text-[11px] text-muted font-medium">Tap: Free → Maybe → Busy → Clear</div>
      </div>
    </div>
  )
}
