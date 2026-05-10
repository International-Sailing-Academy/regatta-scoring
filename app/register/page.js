'use client'

import { useState } from 'react'
import { BOAT_CLASSES, SCORING_CATEGORIES, REGATTA_REGISTER_FALLBACK_URL } from '../lib/registration'

const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.06)',
  color: 'white',
  fontSize: '16px',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '700',
  color: '#63b3ed',
  marginBottom: '7px',
}

function Field({ label, children }) {
  return <label style={{ display: 'block' }}><span style={labelStyle}>{label}</span>{children}</label>
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', country: '', sailNumber: '', boatClass: 'ILCA 6', scoringCategory: 'Open', birthYear: '', emergencyContactName: '', emergencyContactPhone: '', notes: '', waiverAccepted: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to start checkout')
      window.location.href = payload.url
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a192f', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px 18px 60px' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#63b3ed', textDecoration: 'none', fontWeight: '700' }}>← Back to regatta site</a>
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
          <div style={{ color: '#63b3ed', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '13px', fontWeight: '800' }}>Registration open</div>
          <h1 style={{ fontSize: 'clamp(34px, 7vw, 62px)', lineHeight: 1, margin: '12px 0' }}>ILCA Mexican Midwinter Regatta 2027</h1>
          <p style={{ fontSize: '18px', opacity: 0.78, maxWidth: '680px' }}>March 11–13, 2027 • La Cruz de Huanacaxtle, Mexico. Entry fee is <strong>$100 USD</strong>. Payment is processed securely by Stripe.</p>
        </div>

        <form onSubmit={submit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.22)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <Field label="Full name *"><input style={fieldStyle} value={form.fullName} onChange={e => update('fullName', e.target.value)} required /></Field>
            <Field label="Email *"><input type="email" style={fieldStyle} value={form.email} onChange={e => update('email', e.target.value)} required /></Field>
            <Field label="Phone"><input style={fieldStyle} value={form.phone} onChange={e => update('phone', e.target.value)} /></Field>
            <Field label="Country"><input style={fieldStyle} value={form.country} onChange={e => update('country', e.target.value)} placeholder="Mexico, USA, CAN..." /></Field>
            <Field label="Sail number"><input style={fieldStyle} value={form.sailNumber} onChange={e => update('sailNumber', e.target.value)} /></Field>
            <Field label="Boat class *"><select style={fieldStyle} value={form.boatClass} onChange={e => update('boatClass', e.target.value)}>{BOAT_CLASSES.map(item => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Scoring category *"><select style={fieldStyle} value={form.scoringCategory} onChange={e => update('scoringCategory', e.target.value)}>{SCORING_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Birth year"><input type="number" style={fieldStyle} value={form.birthYear} onChange={e => update('birthYear', e.target.value)} placeholder="Optional" /></Field>
            <Field label="Emergency contact name"><input style={fieldStyle} value={form.emergencyContactName} onChange={e => update('emergencyContactName', e.target.value)} /></Field>
            <Field label="Emergency contact phone"><input style={fieldStyle} value={form.emergencyContactPhone} onChange={e => update('emergencyContactPhone', e.target.value)} /></Field>
          </div>

          <div style={{ marginTop: '18px' }}>
            <Field label="Notes"><textarea style={{ ...fieldStyle, minHeight: '90px' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Charter questions, category notes, anything race office should know..." /></Field>
          </div>

          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '18px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
            <input type="checkbox" checked={form.waiverAccepted} onChange={e => update('waiverAccepted', e.target.checked)} required style={{ marginTop: '5px' }} />
            <span>I understand this registration is for regatta entry only. I’ll follow event rules, safety requirements, and race-office instructions.</span>
          </label>

          {error && (
            <div style={{ marginTop: '18px', padding: '14px', borderRadius: '8px', background: 'rgba(229,62,62,0.16)', border: '1px solid rgba(229,62,62,0.35)', color: '#feb2b2' }}>
              {error}
              {error.includes('Stripe is not configured') && <div style={{ marginTop: '8px' }}><a href={REGATTA_REGISTER_FALLBACK_URL} style={{ color: '#63b3ed' }}>Use FareHarbor fallback for now →</a></div>}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '16px 22px', borderRadius: '10px', border: 'none', background: loading ? '#718096' : '#63b3ed', color: '#0a192f', fontWeight: '900', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Opening secure checkout…' : 'Continue to payment — $100'}
          </button>
        </form>
      </div>
    </main>
  )
}
