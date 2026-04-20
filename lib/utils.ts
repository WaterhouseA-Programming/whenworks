import { format, addDays, parseISO, isWeekend } from 'date-fns'
import type { AttendeeWithAvail, DateScore, RunScore } from '@/types'

export { isWeekend }

export const addDaysStr = (dateStr: string, n: number): string =>
  format(addDays(parseISO(dateStr), n), 'yyyy-MM-dd')

export const getDates = (start: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => addDaysStr(start, i))

export const fmtDate = (d: string): string =>
  format(parseISO(d), 'EEE d MMM')

export const fmtLong = (d: string): string =>
  format(parseISO(d), 'EEEE d MMMM yyyy')

export const fmtShort = (d: string): string =>
  format(parseISO(d), 'EEE')

export const fmtDay = (d: string): number =>
  parseISO(d).getDate()

export const fmtMon = (d: string): number =>
  parseISO(d).getMonth() + 1

export const daysSince = (isoStr: string): number =>
  Math.floor((Date.now() - new Date(isoStr).getTime()) / 86400000)

export const COLOURS = [
  '#5b8ef0','#c084fc','#34d88a','#f59e0b',
  '#f05b5b','#f472b6','#38bdf8','#a78bfa'
]

export const getColour = (name: string): string =>
  COLOURS[name.charCodeAt(0) % COLOURS.length]

export const initials = (name: string): string =>
  name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export function scoreDate(attendees: AttendeeWithAvail[], date: string): DateScore {
  let free = 0, total = 0
  for (const a of attendees) {
    const v = a.availability[date]
    if (v !== undefined) { total++; if (v === 'free') free++ }
  }
  return { date, free, total, score: total > 0 ? free / total : 0 }
}

export function bestDates(
  attendees: AttendeeWithAvail[],
  startDate: string,
  daysToShow: number,
  duration: number,
  hideWeekends = false,
): DateScore[] | RunScore[] {
  const all = getDates(startDate, daysToShow)
  const dates = hideWeekends ? all.filter(d => !isWeekend(d)) : all

  if (duration === 1) {
    return dates
      .map(d => scoreDate(attendees, d))
      .sort((a, b) => b.score - a.score || b.free - a.free)
  }

  // Multi-day: score consecutive runs
  const scored = dates.map(d => scoreDate(attendees, d))
  const runs: RunScore[] = []
  for (let i = 0; i <= scored.length - duration; i++) {
    const window = scored.slice(i, i + duration)
    const minScore = Math.min(...window.map(w => w.score))
    const minFree = Math.min(...window.map(w => w.free))
    const avgTotal = window.reduce((s, w) => s + w.total, 0) / duration
    runs.push({
      startDate: window[0].date,
      endDate: window[window.length - 1].date,
      dates: window.map(w => w.date),
      score: minScore,
      free: minFree,
      total: Math.round(avgTotal),
    })
  }
  return runs.sort((a, b) => b.score - a.score || b.free - a.free)
}

export function makeICS(title: string, date: string, note = ''): string {
  const d = date.replace(/-/g, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WhenWorks//EN',
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${d}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${note}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function parseICS(text: string): string[] {
  const busy = new Set<string>()
  for (const ev of text.split('BEGIN:VEVENT').slice(1)) {
    const s = ev.match(/DTSTART[^:]*:(\d{8})/)
    const e = ev.match(/DTEND[^:]*:(\d{8})/)
    if (s) {
      let cur = `${s[1].slice(0,4)}-${s[1].slice(4,6)}-${s[1].slice(6,8)}`
      const end = e ? `${e[1].slice(0,4)}-${e[1].slice(4,6)}-${e[1].slice(6,8)}` : cur
      busy.add(cur) // always add the start date (handles same-day timed events where cur === end)
      while (cur < end) { busy.add(cur); cur = addDaysStr(cur, 1) }
    }
  }
  return Array.from(busy)
}
