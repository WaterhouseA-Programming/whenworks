# WhenWorks

Collaborative scheduling that finds the best date for any group.

---

## Stack

- **Next.js 14** (App Router)
- **Supabase** — Postgres database + Row Level Security
- **Resend** — transactional email (invites, nudges, confirmations)
- **Tailwind CSS**
- **TypeScript**

---

## Setup (5 steps)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project, go to **SQL Editor**
3. Open `supabase/schema.sql` from this repo and run the entire contents
4. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set up Resend (email)

1. Go to [resend.com](https://resend.com) and create an account
2. Create an API key → `RESEND_API_KEY`
3. Add and verify your sending domain in Resend
4. Set `EMAIL_FROM` to e.g. `WhenWorks <noreply@yourdomain.com>`

> **During development:** Resend has a free tier and lets you send to your own email without a domain. Set `EMAIL_FROM=onboarding@resend.dev` to use their test address.

### 4. Create your .env.local

```bash
cp .env.local.example .env.local
```

Fill in all values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_...
EMAIL_FROM=WhenWorks <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com).

Set all environment variables from `.env.local.example` in your Vercel project settings (Settings → Environment Variables), and update `NEXT_PUBLIC_APP_URL` to your live domain.

---

## Project Structure

```
whenworks/
├── app/
│   ├── page.tsx                        # Dashboard — lists all events
│   ├── e/[eventId]/page.tsx            # Event detail — organiser view
│   ├── attend/[token]/page.tsx         # Attendee view — opened from email link
│   ├── api/
│   │   ├── events/route.ts             # GET list, POST create
│   │   ├── events/[id]/route.ts        # GET, PATCH, DELETE single event
│   │   ├── attendees/route.ts          # POST add attendee + send invite
│   │   ├── attendees/[id]/
│   │   │   └── availability/route.ts   # POST save availability
│   │   ├── attend/[token]/route.ts     # GET attendee by token
│   │   ├── nudge/route.ts              # POST send nudge email
│   │   └── notifications/read/route.ts # POST mark notifications read
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui.tsx                          # All shared UI components
│   └── AvailGrid.tsx                   # Availability grid (overview + picker)
├── lib/
│   ├── supabase.ts                     # Supabase clients
│   ├── utils.ts                        # Date helpers, scoring, ICS
│   └── email.ts                        # All email templates via Resend
├── types/index.ts                      # TypeScript types
├── supabase/schema.sql                 # Full DB schema — run in Supabase SQL editor
└── .env.local.example                  # Environment variable template
```

---

## Features

- **Multiple events** — each with their own attendees, date window, and settings
- **Availability grid** — tap or drag to mark Free / Maybe / Busy
- **ICS calendar import** — paste from iPhone, Google Calendar, or Outlook
- **Best date scoring** — single days or consecutive multi-day runs
- **Finalise a date** — organiser locks in the winner, all attendees emailed with .ics file
- **Real share links** — each attendee gets a unique personal URL via email
- **Nudge system** — manual or auto-nudge with configurable threshold
- **Time of day preferences** — Morning / Afternoon / Evening / All Day
- **Duration selector** — find the best run of 1–5 consecutive days
- **Accent colours** — per-event colour coding
- **Weekend filter** — hide weekends from the grid
- **Notifications** — in-app and email alerts for key moments

---

## Adding more features

Some natural next steps:
- **Auth** — add Supabase Auth so organisers have a persistent account
- **Cron nudges** — use Vercel Cron to auto-send nudge emails on a schedule
- **Public event pages** — a shareable read-only view for non-attendees
- **Comments** — let attendees leave notes on specific dates
