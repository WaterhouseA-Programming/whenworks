export type AvailStatus = 'free' | 'busy' | 'maybe'
export type EventStatus = 'open' | 'decided'
export type NotifType = 'all_filled' | 'nudge_sent' | 'auto_nudge' | 'decided' | 'info'

export interface DBEvent {
  id: string
  title: string
  description: string | null
  organiser_name: string
  organiser_email: string
  colour: string
  start_date: string
  days_to_show: number
  duration: number
  nudge_after: number
  time_slots: string[]
  status: EventStatus
  decided_date: string | null
  decided_note: string | null
  created_at: string
  updated_at: string
}

export interface DBAttendee {
  id: string
  event_id: string
  name: string
  email: string
  token: string
  is_organiser: boolean
  nudged_at: string | null
  joined_at: string
}

export interface DBAvailability {
  id: string
  attendee_id: string
  event_id: string
  date: string
  status: AvailStatus
}

export interface DBNotification {
  id: string
  event_id: string
  type: NotifType
  message: string
  read: boolean
  created_at: string
}

// ── Enriched types used in UI ──────────────────────────────────────────────

export interface AttendeeWithAvail extends DBAttendee {
  availability: Record<string, AvailStatus>  // date -> status
}

export interface EventFull extends DBEvent {
  attendees: AttendeeWithAvail[]
  notifications: DBNotification[]
}

export interface DateScore {
  date: string
  free: number
  total: number
  score: number
}

export interface RunScore {
  startDate: string
  endDate: string
  dates: string[]
  score: number
  free: number
  total: number
}
