-- WhenWorks Database Schema
-- Run this in your Supabase SQL editor: supabase.com > your project > SQL Editor
-- Tables are prefixed with ww_ to share the nimblepanda Supabase project

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Events ────────────────────────────────────────────────────────────────────
create table ww_events (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  organiser_name  text not null,
  organiser_email text not null,
  colour        text not null default '#5b8ef0',
  start_date    date not null,
  days_to_show  integer not null default 14,
  duration      integer not null default 1,
  nudge_after   integer not null default 2,  -- days, 0 = disabled
  time_slots    text[] not null default '{"allday"}',
  hide_weekends boolean not null default false,
  status        text not null default 'open' check (status in ('open','decided')),
  decided_date  date,
  decided_note  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Attendees ─────────────────────────────────────────────────────────────────
create table ww_attendees (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references ww_events(id) on delete cascade,
  name          text not null,
  email         text not null,
  token         text not null unique default encode(gen_random_bytes(16), 'hex'),
  is_organiser  boolean not null default false,
  nudged_at     timestamptz,
  joined_at     timestamptz not null default now()
);

-- ── Availability ──────────────────────────────────────────────────────────────
create table ww_availability (
  id            uuid primary key default gen_random_uuid(),
  attendee_id   uuid not null references ww_attendees(id) on delete cascade,
  event_id      uuid not null references ww_events(id) on delete cascade,
  date          date not null,
  status        text not null check (status in ('free','busy','maybe')),
  unique(attendee_id, date)
);

-- ── Notifications ─────────────────────────────────────────────────────────────
create table ww_notifications (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references ww_events(id) on delete cascade,
  type          text not null,  -- all_filled | nudge_sent | auto_nudge | decided | info
  message       text not null,
  read          boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index on ww_attendees(event_id);
create index on ww_attendees(token);
create index on ww_availability(event_id);
create index on ww_availability(attendee_id);
create index on ww_notifications(event_id);

-- ── Updated_at trigger ────────────────────────────────────────────────────────
create or replace function ww_update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger ww_events_updated_at before update on ww_events
  for each row execute function ww_update_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Events: readable by anyone with the event ID (public share)
alter table ww_events enable row level security;
create policy "ww_Events are publicly readable" on ww_events for select using (true);
create policy "ww_Events insertable via API" on ww_events for insert with check (true);
create policy "ww_Events updatable via API" on ww_events for update using (true);
create policy "ww_Events deletable via API" on ww_events for delete using (true);

-- Attendees: readable by anyone
alter table ww_attendees enable row level security;
create policy "ww_Attendees are publicly readable" on ww_attendees for select using (true);
create policy "ww_Attendees insertable via API" on ww_attendees for insert with check (true);
create policy "ww_Attendees updatable via API" on ww_attendees for update using (true);
create policy "ww_Attendees deletable via API" on ww_attendees for delete using (true);

-- Availability: readable by anyone
alter table ww_availability enable row level security;
create policy "ww_Availability publicly readable" on ww_availability for select using (true);
create policy "ww_Availability insertable via API" on ww_availability for insert with check (true);
create policy "ww_Availability updatable via API" on ww_availability for update using (true);
create policy "ww_Availability deletable via API" on ww_availability for delete using (true);

-- Notifications: readable by anyone
alter table ww_notifications enable row level security;
create policy "ww_Notifications publicly readable" on ww_notifications for select using (true);
create policy "ww_Notifications insertable via API" on ww_notifications for insert with check (true);
create policy "ww_Notifications updatable via API" on ww_notifications for update using (true);
create policy "ww_Notifications deletable via API" on ww_notifications for delete using (true);
