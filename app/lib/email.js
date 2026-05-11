import nodemailer from 'nodemailer'
import { clinicOptions } from './clinic-options.js'

const RESEND_API_URL = 'https://api.resend.com/emails'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mexicanmidwinters.com'
export const REGATTA_WHATSAPP_GROUP_URL = `${SITE_URL}/join-whatsapp`
export const REGATTA_SAILORS_URL = `${SITE_URL}/sailors`

function money(cents = 0, currency = 'usd') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format((cents || 0) / 100)
}

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function documentLink(registrations, matchers = []) {
  const docs = registrations[0]?.event_documents || []
  return docs.find(doc => matchers.some(m => String(doc.name || '').toLowerCase().includes(m)))?.url || null
}

export function registrationConfirmationEmail({ registrations = [], checkoutSessionId = '' }) {
  const first = registrations[0] || {}
  const purchaserName = first.purchaser_name || first.full_name || 'there'
  const purchaserEmail = first.purchaser_email || first.email
  const total = registrations.reduce((sum, reg) => sum + (reg.amount_total || 0), 0)
  const currency = first.currency || 'usd'
  const norUrl = documentLink(registrations, ['notice', 'nor']) || `${SITE_URL}/?tab=docs`
  const sailingInstructionsUrl = documentLink(registrations, ['sailing instruction', 'instructions']) || `${SITE_URL}/?tab=docs`
  const sailorRows = registrations.map(reg => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid rgba(10,25,41,0.12);">${escapeHtml(reg.full_name)}</td>
      <td style="padding:12px;border-bottom:1px solid rgba(10,25,41,0.12);">${escapeHtml(reg.boat_class)}</td>
      <td style="padding:12px;border-bottom:1px solid rgba(10,25,41,0.12);">${escapeHtml(reg.sail_number || '—')}</td>
      <td style="padding:12px;border-bottom:1px solid rgba(10,25,41,0.12);">${escapeHtml(reg.scoring_category || '—')}</td>
      <td style="padding:12px;border-bottom:1px solid rgba(10,25,41,0.12);text-align:right;">${money(reg.amount_total, currency)}</td>
    </tr>
  `).join('')

  const subject = 'Mexican Midwinters registration confirmed'
  const clinicText = clinicOptions.map(clinic => `${clinic.title} with ${clinic.coach} (${clinic.dates}) — ${clinic.href}`).join('\n')
  const text = `Hi ${purchaserName},\n\nYour Mexican Midwinters registration is confirmed for ${registrations.length} sailor${registrations.length === 1 ? '' : 's'}.\n\nJoin the regatta WhatsApp group: ${REGATTA_WHATSAPP_GROUP_URL}\n\nTotal paid: ${money(total, currency)}\n\nView the sailor list: ${REGATTA_SAILORS_URL}\nNotice of Race: ${norUrl}\nSailing Instructions: ${sailingInstructionsUrl}\n\nWant to arrive sharp for race day? ISA has two pre-regatta training options before Mexican Midwinters. Details and booking live on the ISA site:\n${clinicText}\n\nInternational Sailing Academy`
  const clinicCards = clinicOptions.map(clinic => `
    <tr>
      <td style="padding:0 0 14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#FAF6EC;border:1px solid rgba(10,25,41,0.12);">
          <tr>
            <td style="padding:18px 18px 8px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#4F6276;">${escapeHtml(clinic.timing)} · ${escapeHtml(clinic.dates)}</td>
          </tr>
          <tr>
            <td style="padding:0 18px 8px;font-family:Arial,sans-serif;font-size:22px;line-height:1.12;font-weight:900;text-transform:uppercase;color:#0A1929;">${escapeHtml(clinic.title)}</td>
          </tr>
          <tr>
            <td style="padding:0 18px 14px;color:#4F6276;font-size:14px;line-height:1.55;">${escapeHtml(clinic.description)}</td>
          </tr>
          <tr>
            <td style="padding:0 18px 18px;color:#0A1929;font-size:13px;line-height:1.5;"><strong>${escapeHtml(clinic.coach)}</strong> · ${escapeHtml(clinic.duration)} · ${escapeHtml(clinic.price)} starting from</td>
          </tr>
          <tr>
            <td style="padding:0 18px 20px;"><a href="${clinic.href}" style="display:inline-block;background:#F4A82A;color:#0A1929;text-decoration:none;font-size:12px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;padding:12px 16px;border-radius:4px;">View on ISA site →</a></td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('')

  const html = `
    <div style="margin:0;padding:0;background:#F2EDE0;">
      <div style="font-family:Manrope,Arial,sans-serif;line-height:1.5;color:#0A1929;max-width:720px;margin:0 auto;padding:28px 18px;">
        <div style="background:#0A1929;color:#F2EDE0;padding:28px;border-radius:4px 4px 0 0;border-bottom:4px solid #F4A82A;">
          <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#F4A82A;margin-bottom:12px;">Mexican Midwinters · 2027</div>
          <h1 style="font-family:Arial Black,Arial,sans-serif;font-size:34px;line-height:0.98;text-transform:uppercase;margin:0;color:#F2EDE0;">Registration confirmed</h1>
        </div>
        <div style="background:#FAF6EC;border:1px solid rgba(10,25,41,0.12);border-top:0;padding:26px;">
          <p style="margin-top:0;">Hi ${escapeHtml(purchaserName)},</p>
          <p>Your registration is confirmed for <strong>${registrations.length} sailor${registrations.length === 1 ? '' : 's'}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid rgba(10,25,41,0.12);font-size:13px;">
            <thead><tr style="background:#F2EDE0;"><th style="padding:12px;text-align:left;">Sailor</th><th style="padding:12px;text-align:left;">Class</th><th style="padding:12px;text-align:left;">Sail #</th><th style="padding:12px;text-align:left;">Division</th><th style="padding:12px;text-align:right;">Paid</th></tr></thead>
            <tbody>${sailorRows}</tbody>
          </table>
          <p style="font-size:22px;margin:18px 0;"><strong>Total paid:</strong> <span style="color:#F4A82A;">${money(total, currency)}</span></p>
          <div style="background:#0A1929;color:#F2EDE0;border:1px solid #1B304A;border-radius:4px;padding:20px;margin:24px 0;">
            <h2 style="margin:0 0 8px;color:#F4A82A;font-size:20px;text-transform:uppercase;">Join the regatta WhatsApp group</h2>
            <p style="margin:0 0 14px;color:rgba(242,237,224,0.82);">We’ll use this group for race-office updates, logistics, and sailor notices.</p>
            <a href="${REGATTA_WHATSAPP_GROUP_URL}" style="display:inline-block;background:#F4A82A;color:#0A1929;text-decoration:none;font-weight:900;padding:12px 18px;border-radius:4px;">Join WhatsApp group</a>
          </div>
          <div style="background:#F2EDE0;border:1px solid rgba(10,25,41,0.12);border-radius:4px;padding:18px;margin:22px 0;">
            <h2 style="margin:0 0 10px;color:#0A1929;font-size:20px;text-transform:uppercase;">Regatta documents</h2>
            <p style="margin:0 0 8px;"><a href="${norUrl}" style="color:#0A1929;font-weight:700;">Notice of Race</a></p>
            <p style="margin:0;"><a href="${sailingInstructionsUrl}" style="color:#0A1929;font-weight:700;">Sailing Instructions</a></p>
          </div>
          <h2 style="margin:28px 0 8px;color:#0A1929;font-size:22px;text-transform:uppercase;">Pre-regatta training with ISA</h2>
          <p style="margin:0 0 14px;color:#4F6276;font-size:14px;line-height:1.55;">Want to arrive sharp for race day? These ISA training options run before Mexican Midwinters. Use the links below for clinic details and booking on the ISA site.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${clinicCards}</table>
          <p><a href="${REGATTA_SAILORS_URL}" style="color:#0A1929;font-weight:700;">View the registered sailor list</a></p>
          <p><a href="${SITE_URL}" style="color:#0A1929;font-weight:700;">Visit the regatta website</a></p>
          <p style="color:#4F6276;font-size:12px;">Checkout session: ${escapeHtml(checkoutSessionId)}</p>
          <p>International Sailing Academy</p>
        </div>
      </div>
    </div>
  `

  return { to: purchaserEmail, subject, text, html }
}

export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.CONFIRMATION_EMAIL_FROM || 'Mexican Midwinters <info@internationalsailingacademy.com>'
  const replyTo = process.env.CONFIRMATION_EMAIL_REPLY_TO || 'info@internationalsailingacademy.com'

  if (process.env.FASTMAIL_SMTP_USER && process.env.FASTMAIL_SMTP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      host: process.env.FASTMAIL_SMTP_HOST || 'smtp.fastmail.com',
      port: Number(process.env.FASTMAIL_SMTP_PORT || 465),
      secure: String(process.env.FASTMAIL_SMTP_PORT || '465') === '465',
      auth: {
        user: process.env.FASTMAIL_SMTP_USER,
        pass: process.env.FASTMAIL_SMTP_PASSWORD,
      },
    })
    return transporter.sendMail({ from, to, replyTo, subject, text, html })
  }

  if (!process.env.RESEND_API_KEY) throw new Error('No email provider configured')
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, text, html, reply_to: replyTo }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || payload.error || `Email failed with ${response.status}`)
  return payload
}
