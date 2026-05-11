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
  emptySailor,
  registrationAddOns,
  registrationTotalCents,
  sailorTotalCents,
} from '../lib/registration'

const fieldStyle = { width: '100%', minHeight: '50px', padding: '12px 14px', borderRadius: '4px', border: '1px solid rgba(10,25,41,0.18)', background: '#FAF6EC', color: '#0A1929', fontSize: '16px', lineHeight: '1.35', boxSizing: 'border-box', fontFamily: 'Manrope, system-ui, sans-serif' }
const labelStyle = { display: 'block', fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: '11px', fontWeight: '700', color: '#4F6276', marginBottom: '8px', lineHeight: '1.3', letterSpacing: '0.18em', textTransform: 'uppercase' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }

function Field({ label, help, children }) {
  return <label style={{ display: 'block' }}><span style={labelStyle}>{label}</span>{children}{help ? <span style={{ display: 'block', marginTop: '6px', color: 'rgba(10,25,41,0.55)', fontSize: '12px', lineHeight: 1.35 }}>{help}</span> : null}</label>
}

function Select({ value, onChange, children, required = false }) {
  return <select style={{ ...fieldStyle, height: '52px', paddingRight: '42px', appearance: 'auto', WebkitAppearance: 'menulist' }} value={value} onChange={onChange} required={required}>{children}</select>
}

function money(cents) { return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }

function AddOnSummary({ sailor }) {
  const addOns = registrationAddOns(sailor)
  return <div style={{ opacity: 0.72, marginTop: '4px' }}>Entry {money(REGATTA_PRICE_CENTS)}{addOns.length ? ` + ${addOns.map(a => `${a.quantity}× ${a.label}`).join(' + ')}` : ''}</div>
}

export default function RegisterPage() {
  const [purchaser, setPurchaser] = useState({ fullName: '', email: '', phone: '', whatsapp: '', emergencyContactName: '', emergencyContactPhone: '' })
  const [sailors, setSailors] = useState([emptySailor()])
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = useMemo(() => registrationTotalCents({ sailors }), [sailors])
  const updatePurchaser = (key, value) => setPurchaser(prev => ({ ...prev, [key]: value, ...(key === 'phone' && !prev.whatsapp ? { whatsapp: value } : {}) }))
  const updateSailor = (index, key, value) => setSailors(prev => prev.map((sailor, i) => {
    if (i !== index) return sailor
    const next = { ...sailor, [key]: value }
    if (key === 'charterDaysShort' && Number(value) > 0) next.charterDaysExtended = 0
    if (key === 'charterDaysExtended' && Number(value) > 0) next.charterDaysShort = 0
    return next
  }))
  const addSailor = () => setSailors(prev => [...prev, emptySailor()])
  const duplicateSailor = (index) => setSailors(prev => [...prev.slice(0, index + 1), { ...prev[index], fullName: '', sailNumber: '' }, ...prev.slice(index + 1)])
  const removeSailor = (index) => setSailors(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== index))

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const response = await fetch('/api/stripe/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purchaser, sailors, waiverAccepted }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to start checkout')
      window.location.href = payload.url
    } catch (err) { setError(err.message); setLoading(false) }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F2EDE0', color: '#0A1929', fontFamily: 'Manrope, system-ui, sans-serif', padding: '32px 18px 60px' }}>
      <datalist id="countries">{COMMON_COUNTRIES.map(country => <option key={country} value={country} />)}</datalist>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#F4A82A', textDecoration: 'none', fontWeight: '700' }}>← Back to regatta site</a>
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
          <div style={{ color: '#F4A82A', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '13px', fontWeight: '800' }}>Registration open</div>
          <h1 style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.025em', fontSize: 'clamp(48px, 9vw, 104px)', lineHeight: 0.92, margin: '12px 0' }}>ILCA Mexican Midwinter Regatta 2027</h1>
          <p style={{ fontSize: '18px', opacity: 0.78, maxWidth: '760px' }}>Register one or multiple sailors in a single secure checkout. Entry is <strong>$100 USD per sailor</strong>; charter/facility-use add-ons are selected per sailor.</p>
        </div>

        <form onSubmit={submit} style={{ background: '#FAF6EC', border: '1px solid rgba(10,25,41,0.12)', borderRadius: '4px', padding: '24px', boxShadow: '0 18px 50px rgba(0,0,0,0.22)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Purchaser / primary contact</h2>
          <div style={gridStyle}>
            <Field label="Purchaser name *"><input style={fieldStyle} value={purchaser.fullName} onChange={e => updatePurchaser('fullName', e.target.value)} required /></Field>
            <Field label="Purchaser email *"><input type="email" style={fieldStyle} value={purchaser.email} onChange={e => updatePurchaser('email', e.target.value)} required /></Field>
            <Field label="Phone"><input style={fieldStyle} value={purchaser.phone} onChange={e => updatePurchaser('phone', e.target.value)} placeholder="Optional" /></Field>
            <Field label="WhatsApp number *" help="Include country code. Example: 19178675309"><input style={fieldStyle} value={purchaser.whatsapp} onChange={e => updatePurchaser('whatsapp', e.target.value)} required /></Field>
            <Field label="Emergency contact name *"><input style={fieldStyle} value={purchaser.emergencyContactName} onChange={e => updatePurchaser('emergencyContactName', e.target.value)} required /></Field>
            <Field label="Emergency contact phone *"><input style={fieldStyle} value={purchaser.emergencyContactPhone} onChange={e => updatePurchaser('emergencyContactPhone', e.target.value)} required /></Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginTop: '32px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Sailors</h2>
            <button type="button" onClick={addSailor} style={{ background: '#F4A82A', color: '#0A1929', border: 'none', borderRadius: '4px', padding: '11px 16px', fontWeight: 900, cursor: 'pointer' }}>+ Add another sailor</button>
          </div>

          {sailors.map((sailor, index) => (
            <section key={index} style={{ marginTop: index ? '22px' : 0, padding: '18px', border: '1px solid rgba(10,25,41,0.14)', borderRadius: '4px', background: '#F2EDE0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '22px' }}>Sailor {index + 1}</h3>
                  <AddOnSummary sailor={sailor} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => duplicateSailor(index)} style={{ background: 'transparent', color: '#F4A82A', border: '1px solid rgba(244,168,42,0.45)', borderRadius: '4px', padding: '9px 12px', fontWeight: 800 }}>Duplicate</button>
                  {sailors.length > 1 && <button type="button" onClick={() => removeSailor(index)} style={{ background: 'transparent', color: '#7F1D1D', border: '1px solid rgba(254,178,178,0.35)', borderRadius: '4px', padding: '9px 12px', fontWeight: 800 }}>Remove</button>}
                </div>
              </div>

              <div style={gridStyle}>
                <Field label="Sailor full name *"><input style={fieldStyle} value={sailor.fullName} onChange={e => updateSailor(index, 'fullName', e.target.value)} required /></Field>
                <Field label="Country *"><input list="countries" style={fieldStyle} value={sailor.country} onChange={e => updateSailor(index, 'country', e.target.value)} placeholder="Mexico" required /></Field>
                <Field label="Sail number *"><input style={fieldStyle} value={sailor.sailNumber} onChange={e => updateSailor(index, 'sailNumber', e.target.value)} required /></Field>
                <Field label="Rig *"><Select required value={sailor.boatClass} onChange={e => updateSailor(index, 'boatClass', e.target.value)}>{BOAT_CLASSES.map(item => <option key={item}>{item}</option>)}</Select></Field>
                <Field label="Scoring category *"><Select required value={sailor.scoringCategory} onChange={e => updateSailor(index, 'scoringCategory', e.target.value)}><option value="">Choose an option</option>{SCORING_CATEGORIES.map(item => <option key={item}>{item}</option>)}</Select></Field>
                <Field label="T-shirt size *"><Select required value={sailor.tshirtSize} onChange={e => updateSailor(index, 'tshirtSize', e.target.value)}><option value="">Choose an option</option>{TSHIRT_SIZES.map(item => <option key={item}>{item}</option>)}</Select></Field>
                <Field label="Birth year"><input type="number" style={fieldStyle} value={sailor.birthYear} onChange={e => updateSailor(index, 'birthYear', e.target.value)} placeholder="Optional" /></Field>
                <Field label="Dates of charter / facility use" help="Required only if selecting charter days."><input style={fieldStyle} value={sailor.charterDates} onChange={e => updateSailor(index, 'charterDates', e.target.value)} placeholder="Mar 9–13" /></Field>
                <Field label={`${ADD_ONS.charterShort.label} — $150/day`}><Select value={sailor.charterDaysShort} onChange={e => updateSailor(index, 'charterDaysShort', Number(e.target.value))}>{Array.from({ length: 6 }, (_, i) => <option key={i} value={i}>{i}</option>)}</Select></Field>
                <Field label={`${ADD_ONS.charterExtended.label} — $130/day`}><Select value={sailor.charterDaysExtended} onChange={e => updateSailor(index, 'charterDaysExtended', Number(e.target.value))}>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i}>{i}</option>)}</Select></Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '18px' }}>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(10,25,41,0.12)', borderRadius: '4px', background: 'rgba(10,25,41,0.035)' }}><input type="checkbox" checked={sailor.proKitRental} onChange={e => updateSailor(index, 'proKitRental', e.target.checked)} style={{ marginTop: '4px' }} /><span><strong>Pro Kit Rental — $75</strong><br /><small style={{ opacity: 0.7 }}>Full rigging & carbon tiller/extension. Does not include sail or battens.</small></span></label>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(10,25,41,0.12)', borderRadius: '4px', background: 'rgba(10,25,41,0.035)' }}><input type="checkbox" checked={sailor.boatInsurance} onChange={e => updateSailor(index, 'boatInsurance', e.target.checked)} style={{ marginTop: '4px' }} /><span><strong>Boat Insurance — $80</strong><br /><small style={{ opacity: 0.7 }}>Damage protection for charter equipment.</small></span></label>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(10,25,41,0.12)', borderRadius: '4px', background: 'rgba(10,25,41,0.035)' }}><input type="checkbox" checked={sailor.sailBattenRental} onChange={e => updateSailor(index, 'sailBattenRental', e.target.checked)} style={{ marginTop: '4px' }} /><span><strong>Sail + Batten Rental — $150</strong><br /><small style={{ opacity: 0.7 }}>Rental sail and battens for the selected rig.</small></span></label>
              </div>

              <div style={{ ...gridStyle, marginTop: '18px' }}>
                <Field label="Pertinent medical conditions"><textarea style={{ ...fieldStyle, minHeight: '90px' }} value={sailor.medicalConditions} onChange={e => updateSailor(index, 'medicalConditions', e.target.value)} /></Field>
                <Field label="Notes"><textarea style={{ ...fieldStyle, minHeight: '90px' }} value={sailor.notes} onChange={e => updateSailor(index, 'notes', e.target.value)} placeholder="Anything race office should know..." /></Field>
              </div>

              <div style={{ marginTop: '14px', textAlign: 'right', color: '#F4A82A', fontWeight: 900 }}>Sailor subtotal: {money(sailorTotalCents(sailor))}</div>
            </section>
          ))}

          <div style={{ marginTop: '24px', padding: '18px', borderRadius: '4px', background: '#0A1929', border: '1px solid #1B304A' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ color: '#F2EDE0' }}><strong>Checkout summary</strong><div style={{ opacity: 0.72, marginTop: '4px' }}>{sailors.length} sailor{sailors.length === 1 ? '' : 's'} • one Stripe payment</div></div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#F4A82A' }}>{money(total)}</div>
            </div>
          </div>

          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '18px', color: 'rgba(10,25,41,0.82)', lineHeight: 1.5 }}><input type="checkbox" checked={waiverAccepted} onChange={e => setWaiverAccepted(e.target.checked)} required style={{ marginTop: '5px' }} /><span>I understand this registration is for all listed sailors and selected add-ons. We’ll follow event rules, safety requirements, and race-office instructions.</span></label>

          {error && <div style={{ marginTop: '18px', padding: '14px', borderRadius: '4px', background: 'rgba(231,111,81,0.16)', border: '1px solid rgba(231,111,81,0.35)', color: '#7F1D1D' }}>{error}{error.includes('Stripe is not configured') && <div style={{ marginTop: '8px' }}><a href={REGATTA_REGISTER_FALLBACK_URL} style={{ color: '#F4A82A' }}>Use FareHarbor fallback for now →</a></div>}</div>}

          <button type="submit" disabled={loading} style={{ marginTop: '24px', width: '100%', padding: '16px 22px', borderRadius: '4px', border: 'none', background: loading ? '#7A8FA5' : '#F4A82A', color: '#0A1929', fontWeight: '900', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Opening secure checkout…' : `Continue to payment — ${money(total)}`}</button>
        </form>
      </div>
    </main>
  )
}
