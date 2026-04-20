import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'WhenWorks <noreply@whenworks.app>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function sendInviteEmail(opts: {
  toName: string
  toEmail: string
  eventTitle: string
  organiserName: string
  token: string
  eventId: string
}) {
  const link = `${APP_URL}/attend/${opts.token}`
  await resend.emails.send({
    from: FROM,
    to: opts.toEmail,
    subject: `${opts.organiserName} wants to find a date — ${opts.eventTitle}`,
    html: emailTemplate({
      heading: `You're invited to help find a date`,
      body: `<p><strong>${opts.organiserName}</strong> is organising <strong>${opts.eventTitle}</strong> and wants to know when you're free.</p>
             <p>It only takes a minute — just mark which dates work for you.</p>`,
      ctaText: 'Fill in my availability',
      ctaUrl: link,
      footer: `This link is unique to you (${opts.toEmail}). No sign-up needed.`
    })
  })
}

export async function sendNudgeEmail(opts: {
  toName: string
  toEmail: string
  eventTitle: string
  organiserName: string
  token: string
}) {
  const link = `${APP_URL}/attend/${opts.token}`
  await resend.emails.send({
    from: FROM,
    to: opts.toEmail,
    subject: `Reminder: fill in your availability for ${opts.eventTitle}`,
    html: emailTemplate({
      heading: `Don't forget to fill in your dates`,
      body: `<p><strong>${opts.organiserName}</strong> is still waiting for your availability for <strong>${opts.eventTitle}</strong>.</p>
             <p>Takes less than a minute — just tap which dates work for you.</p>`,
      ctaText: 'Fill in my availability',
      ctaUrl: link,
      footer: `You're receiving this because you were invited to ${opts.eventTitle}.`
    })
  })
}

export async function sendDecidedEmail(opts: {
  toName: string
  toEmail: string
  eventTitle: string
  organiserName: string
  decidedDate: string
  decidedNote: string
  icsContent: string
}) {
  await resend.emails.send({
    from: FROM,
    to: opts.toEmail,
    subject: `Date confirmed: ${opts.eventTitle} — ${opts.decidedDate}`,
    html: emailTemplate({
      heading: `Date confirmed! 🎉`,
      body: `<p>The date for <strong>${opts.eventTitle}</strong> has been confirmed by ${opts.organiserName}.</p>
             <p style="font-size:20px;font-weight:700;color:#34d88a;margin:16px 0">${opts.decidedDate}</p>
             ${opts.decidedNote ? `<p>${opts.decidedNote}</p>` : ''}
             <p>The .ics calendar file is attached — open it to add the event directly to your calendar.</p>`,
      ctaText: 'View Event',
      ctaUrl: `${APP_URL}`,
      footer: `Organised by ${opts.organiserName}.`
    }),
    attachments: [
      {
        filename: `${opts.eventTitle.replace(/[^a-z0-9]/gi,'_')}.ics`,
        content: Buffer.from(opts.icsContent).toString('base64'),
      }
    ]
  })
}

export async function sendOrganizerAllFilledEmail(opts: {
  toName: string
  toEmail: string
  eventTitle: string
  bestDate: string
  eventId: string
}) {
  await resend.emails.send({
    from: FROM,
    to: opts.toEmail,
    subject: `Everyone's filled in for ${opts.eventTitle} — best date found!`,
    html: emailTemplate({
      heading: `All availability is in! 🎉`,
      body: `<p>Everyone has filled in their availability for <strong>${opts.eventTitle}</strong>.</p>
             <p>Best date so far: <strong style="color:#34d88a">${opts.bestDate}</strong></p>
             <p>Head to your event to review all dates and finalise.</p>`,
      ctaText: 'View results & finalise',
      ctaUrl: `${APP_URL}/e/${opts.eventId}`,
      footer: `You're the organiser of ${opts.eventTitle}.`
    })
  })
}

function emailTemplate(opts: {
  heading: string
  body: string
  ctaText: string
  ctaUrl: string
  footer: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background:#0c0c0f;color:#eeeef5;font-family:sans-serif;margin:0;padding:40px 16px">
  <div style="max-width:520px;margin:0 auto">
    <div style="font-size:18px;font-weight:700;margin-bottom:32px">
      <span style="background:linear-gradient(135deg,#5b8ef0,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent">WhenWorks</span>
    </div>
    <div style="background:#131317;border:1px solid #2a2a35;border-radius:12px;padding:28px">
      <h1 style="font-size:22px;font-weight:700;margin:0 0 16px">${opts.heading}</h1>
      <div style="color:#b0b0c0;font-size:15px;line-height:1.6">${opts.body}</div>
      <a href="${opts.ctaUrl}" style="display:inline-block;background:#5b8ef0;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin-top:24px">${opts.ctaText}</a>
    </div>
    <p style="color:#72728a;font-size:12px;margin-top:20px;line-height:1.5">${opts.footer}</p>
  </div>
</body>
</html>`
}
