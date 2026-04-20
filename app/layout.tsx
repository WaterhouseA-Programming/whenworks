import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WhenWorks — Find a date that works for everyone',
  description: 'Collaborative scheduling that finds the best date for any group — no back-and-forth.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
