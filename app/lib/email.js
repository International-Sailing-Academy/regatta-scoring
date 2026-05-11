const RESEND_API_URL = 'https://api.resend.com/emails'
export const REGATTA_WHATSAPP_GROUP_URL = process.env.NEXT_PUBLIC_REGATTA_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/GJnmwjNCylf6BtRlyTtyaw'

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

export function registrationConfirmationEmail({ registrations = [], checkoutSessionId = '' }) {
  const first = registrations[0] || {}
  const purchaserName = first.purchaser_name || first.full_name || 'there'
  const purchaserEmail = first.purchaser_email || first.email
  const total = registrations.reduce((sum, reg) => sum + (reg.amount_total || 0), 0)
  const currency = first.currency || 'usd'
  const sailorRows = registrations.map(reg => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(reg.full_name)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(reg.boat_class)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(reg.sail_number || '—')}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(reg.scoring_category || '—')}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${money(reg.amount_total, currency)}</td>
    </tr>
  `).join('')

  const subject = 'Mexican Midwinters registration confirmed'
  const text = `Hi ${purchaserName},\n\nYour Mexican Midwinters registration is confirmed for ${registrations.length} sailor${registrations.length === 1 ? '' : 's'}.\n\nJoin the regatta WhatsApp group: ${REGATTA_WHATSAPP_GROUP_URL}\n\nTotal paid: ${money(total, currency)}\n\nView the sailor list: https://www.mexicanmidwinters.com/?tab=sailors\n\nInternational Sailing Academy`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:680px;margin:0 auto;">
      <h1 style="color:#0a192f;">Mexican Midwinters registration confirmed</h1>
      <p>Hi ${escapeHtml(purchaserName)},</p>
      <p>Your registration is confirmed for <strong>${registrations.length} sailor${registrations.length === 1 ? '' : 's'}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:18px 0;border:1px solid #e5e7eb;">
        <thead><tr style="background:#f3f4f6;"><th style="padding:10px;text-align:left;">Sailor</th><th style="padding:10px;text-align:left;">Class</th><th style="padding:10px;text-align:left;">Sail #</th><th style="padding:10px;text-align:left;">Division</th><th style="padding:10px;text-align:right;">Paid</th></tr></thead>
        <tbody>${sailorRows}</tbody>
      </table>
      <p style="font-size:18px;"><strong>Total paid:</strong> ${money(total, currency)}</p>
      <div style="background:#e8f7ef;border:1px solid #25D366;border-radius:10px;padding:18px;margin:22px 0;">
        <h2 style="margin:0 0 8px;color:#075e2a;">Join the regatta WhatsApp group</h2>
        <p style="margin:0 0 14px;">We’ll use this group for race-office updates, logistics, and sailor notices.</p>
        <a href="${REGATTA_WHATSAPP_GROUP_URL}" style="display:inline-block;background:#25D366;color:#062414;text-decoration:none;font-weight:bold;padding:12px 18px;border-radius:8px;">Join WhatsApp group</a>
      </div>
      <p><a href="https://www.mexicanmidwinters.com/?tab=sailors">View the registered sailor list</a></p>
      <p style="color:#6b7280;font-size:13px;">Checkout session: ${escapeHtml(checkoutSessionId)}</p>
      <p>International Sailing Academy</p>
    </div>
  `

  return { to: purchaserEmail, subject, text, html }
}

export async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')
  const from = process.env.CONFIRMATION_EMAIL_FROM || 'International Sailing Academy <info@internationalsailingacademy.com>'
  const replyTo = process.env.CONFIRMATION_EMAIL_REPLY_TO || 'info@internationalsailingacademy.com'
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
