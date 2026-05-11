'use client'

import { useMemo, useState } from 'react'
import {
  ADD_ONS,
  BOAT_CLASSES,
  COMMON_COUNTRIES,
  REGATTA_PRICE_CENTS,
  REGATTA_REGISTER_FALLBACK_URL,
  SCORING_CATEGORIES,
  TSHIRT_SIZES,
  registrationTotalCents,
} from '../lib/registration'

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

function Field({ label, help, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {help ? <span style={{ display: 'block', marginTop: '6px', color: 'rgba(255,255,255,0.55)', fontSize: '12px', lineHeight: 1.35 }}>{help}</span> : null}
    </label>
  )
}

function Select({ value, onChange, children, required = false }) {
  return <select style={fieldStyle} value={value} onChange={onChange} required={required}>{children}</select>
}

function money(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    country: '',
    sailNumber: '',
    boatClass: 'ILCA 6',
    scoringCategory: '',
    tshirtSize: '',
    birthYear: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalConditions: '',
    charterDates: '',
    charterDaysShort: 0,
    charterDaysExtended: 0,
    proKitRental: false,
    boatInsurance: false,
    notes: '',
    waiverAccepted: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => setForm(prev => {
    const next = { ...prev, [key]: value }
    if (key === 'charterDaysShort' && Number(value) > 0) next.charterDaysExtended = 0
    if (key === 'charterDaysExtended' && Number(value) > 0) next.charterDaysShort = 0
    if (key === 'phone' && !prev.whatsapp) next.whatsapp = value
    return next
  })

  const total = useMemo(() => registrationTotalCents(form), [form])
  const selectedAddOns = [
    Number(form.charterDaysShort) > 0 ? `${form.charterDaysShort} short charter day${Number(form.charterDaysShort) === 1 ? '' : 's'}` : null,
    Number(form.charterDaysExtended) > 0 ? `${form.charterDaysExtended} extended charter day${Number(form.charterDaysExtended) === 1 ? '' : 's'}` : null,
    form.proKitRental ? 'Pro kit rental' : null,
    form.boatInsurance ? 'Boat insurance' : null,
  ].filter(Boolean)

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
      <datalist id="countries">{COMMON_COUNTRIES.map(country => <option key={country} value={country} />)}</datalist>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#63b3ed', textDecoration: 'none', fontWeight: '700' }}>← Back to regatta site</a>
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
          <div style={{ color: '#63b3ed', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '13px', fontWeight: '800' }}>Registration open</div>
          <h1 style={{ fontSize: 'clamp(34px, 7vw, 62px)', lineHeight: 1, margin: '12px 0' }}>ILCA Mexican Midwinter Regatta 2027</h1>
          <p style={{ fontSize: '18px', opacity: 0.78, maxWidth: '720px' }}>March 11–13, 2027 • La Cruz de Huanacaxtle, Mexico. Entry fee is <strong>$100 USD</strong>. Optional charter/facility-use add-ons can be selected before secure Stripe checkout.</p>
        </div>

        <form onSubmit={submit} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.22)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Sailor details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <Field label="Full name *"><input style={fieldStyle} value={form.fullName} onChange={e => update('fullName', e.target.value)} required /></Field>
            <Field label="Email *"><input type="email" style={fieldStyle} value={form.email} onChange={e => update('email', e.target.value)} required /></Field>
            <Field label="Phone"><input style={fieldStyle} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Optional" /></Field>
            <Field label="WhatsApp number *" help="Include country code, numbers only if possible. Example: 19178675309"><input style={fieldStyle} value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)} placeholder="19178675309" required /></Field>
            <Field label="Country *"><input list="countries" style={fieldStyle} value={form.country} onChange={e => update('country', e.target.value)} placeholder="Mexico" required /></Field>
            <Field label="Sail number *"><input style={fieldStyle} value={form.sailNumber} onChange={e => update('sailNumber', e.target.value)} required /></Field>
            <Field label="What rig will you be sailing? *"><Select required value={form.boatClass} onChange={e => update('boatClass', e.target.value)}>{BOAT_CLASSES.map(item => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="Scoring category *"><Select required value={form.scoringCategory} onChange={e => update('scoringCategory', e.target.value)}><option value="">Choose an option</option>{SCORING_CATEGORIES.map(item => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="T-shirt size *"><Select required value={form.tshirtSize} onChange={e => update('tshirtSize', e.target.value)}><option value="">Choose an option</option>{TSHIRT_SIZES.map(item => <option key={item}>{item}</option>)}</Select></Field>
            <Field label="Birth year"><input type="number" style={fieldStyle} value={form.birthYear} onChange={e => update('birthYear', e.target.value)} placeholder="Optional" /></Field>
            <Field label="Emergency contact name *"><input style={fieldStyle} value={form.emergencyContactName} onChange={e => update('emergencyContactName', e.target.value)} required /></Field>
            <Field label="Emergency contact phone *"><input style={fieldStyle} value={form.emergencyContactPhone} onChange={e => update('emergencyContactPhone', e.target.value)} required /></Field>
          </div>

          <h2 style={{ marginTop: '30px', marginBottom: '16px' }}>Charter & add-ons</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
            <Field label="Dates of charter / facility use" help="Required only if selecting charter days."><input style={fieldStyle} value={form.charterDates} onChange={e => update('charterDates', e.target.value)} placeholder="Mar 9–13" /></Field>
            <Field label={`${ADD_ONS.charterShort.label} — $150/day`}><Select value={form.charterDaysShort} onChange={e => update('charterDaysShort', Number(e.target.value))}>{Array.from({ length: 6 }, (_, i) => <option key={i} value={i}>{i}</option>)}</Select></Field>
            <Field label={`${ADD_ONS.charterExtended.label} — $130/day`}><Select value={form.charterDaysExtended} onChange={e => update('charterDaysExtended', Number(e.target.value))}>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{i}</option>)}</Select></Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '18px' }}>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
              <input type="checkbox" checked={form.proKitRental} onChange={e => update('proKitRental', e.target.checked)} style={{ marginTop: '4px' }} />
              <span><strong>Pro Kit Rental — $75</strong><br /><small style={{ opacity: 0.7 }}>Full rigging & carbon tiller/extension. Does not include sail or battens.</small></span>
            </label>
            <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
              <input type="checkbox" checked={form.boatInsurance} onChange={e => update('boatInsurance', e.target.checked)} style={{ marginTop: '4px' }} />
              <span><strong>Boat Insurance — $80</strong><br /><small style={{ opacity: 0.7 }}>Damage protection for charter equipment.</small></span>
            </label>
          </div>

          <h2 style={{ marginTop: '30px', marginBottom: '16px' }}>Race office notes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
            <Field label="Pertinent medical conditions"><textarea style={{ ...fieldStyle, minHeight: '90px' }} value={form.medicalConditions} onChange={e => update('medicalConditions', e.target.value)} /></Field>
            <Field label="Notes"><textarea style={{ ...fieldStyle, minHeight: '90px' }} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Anything race office should know..." /></Field>
          </div>

          <div style={{ marginTop: '24px', padding: '18px', borderRadius: '12px', background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <strong>Checkout summary</strong>
                <div style={{ opacity: 0.72, marginTop: '4px' }}>Entry {money(REGATTA_PRICE_CENTS)}{selectedAddOns.length ? ` + ${selectedAddOns.join(' + ')}` : ''}</div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#63b3ed' }}>{money(total)}</div>
            </div>
          </div>

          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '18px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.5 }}>
            <input type="checkbox" checked={form.waiverAccepted} onChange={e => update('waiverAccepted', e.target.checked)} required style={{ marginTop: '5px' }} />
            <span>I understand this registration is for regatta entry and selected add-ons. I’ll follow event rules, safety requirements, and race-office instructions.</span>
          </label>

          {error && (
            <div style={{ marginTop: '18px', padding: '14px', borderRadius: '8px', background: 'rgba(229,62,62,0.16)', border: '1px solid rgba(229,62,62,0.35)', color: '#feb2b2' }}>
              {error}
              {error.includes('Stripe is not configured') && <div style={{ marginTop: '8px' }}><a href={REGATTA_REGISTER_FALLBACK_URL} style={{ color: '#63b3ed' }}>Use FareHarbor fallback for now →</a></div>}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '16px 22px', borderRadius: '10px', border: 'none', background: loading ? '#718096' : '#63b3ed', color: '#0a192f', fontWeight: '900', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Opening secure checkout…' : `Continue to payment — ${money(total)}`}
          </button>
        </form>
      </div>
    </main>
  )
}
