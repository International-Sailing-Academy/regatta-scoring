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

const fieldStyle = { width: '100%', minHeight: '48px', padding: '12px 14px', borderRadius: '2px', border: '1px solid rgba(14,17,22,0.22)', background: '#FFFBF2', color: '#0E1116', fontSize: '16px', lineHeight: '1.35', boxSizing: 'border-box', fontFamily: 'var(--mm-body)' }
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#C8311E', marginBottom: '8px', lineHeight: '1.3', fontFamily: 'var(--mm-mono)', letterSpacing: '0.16em', textTransform: 'uppercase' }
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }

function Field({ label, help, children }) {
  return <label style={{ display: 'block' }}><span style={labelStyle}>{label}</span>{children}{help ? <span style={{ display: 'block', marginTop: '6px', color: 'rgba(14,17,22,0.58)', fontSize: '12px', lineHeight: 1.35 }}>{help}</span> : null}</label>
}

function Select({ value, onChange, children, required = false }) {
  return <select style={{ ...fieldStyle, height: '52px', paddingRight: '42px', appearance: 'auto', WebkitAppearance: 'menulist' }} value={value} onChange={onChange} required={required}>{children}</select>
}

function money(cents) { return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` }

function AddOnSummary({ sailor }) {
  const addOns = registrationAddOns(sailor)
  return <div style={{ opacity: 0.68, marginTop: '4px' }}>Entry {money(REGATTA_PRICE_CENTS)}{addOns.length ? ` + ${addOns.map(a => `${a.quantity}× ${a.label}`).join(' + ')}` : ''}</div>
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
    <main className="mm-register" style={{ minHeight: '100vh', background: '#F4EDDF', color: '#0E1116', fontFamily: 'var(--mm-body)', padding: '32px 18px 60px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Antonio:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        :root { --mm-ink:#0E1116; --mm-ink-2:#181C24; --mm-cream:#F4EDDF; --mm-bone:#FFFBF2; --mm-rojo:#C8311E; --mm-rojo-2:#E04A38; --mm-verde:#1B4034; --mm-sun:#F4C724; --mm-display:'Antonio','Oswald','Impact',sans-serif; --mm-body:'Space Grotesk',system-ui,sans-serif; --mm-mono:'JetBrains Mono',ui-monospace,monospace; }
        .mm-register a:focus-visible, .mm-register button:focus-visible, .mm-register input:focus-visible, .mm-register select:focus-visible, .mm-register textarea:focus-visible { outline: 2px solid var(--mm-sun); outline-offset: 3px; }
        .mm-display { font-family: var(--mm-display); font-style: italic; font-weight: 700; text-transform: uppercase; letter-spacing: -0.02em; }
        .mm-mono { font-family: var(--mm-mono); letter-spacing: .18em; text-transform: uppercase; }
        .mm-btn { transition: transform 180ms cubic-bezier(.2,.7,.1,1), background 180ms; }
        .mm-btn:hover { transform: translateY(-1px) skewX(-2deg); background: var(--mm-rojo-2) !important; }
      `}</style>
      <datalist id="countries">{COMMON_COUNTRIES.map(country => <option key={country} value={country} />)}</datalist>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        <a href="/" style={{ color: '#C8311E', textDecoration: 'none', fontWeight: '700' }}>← Back to regatta site</a>
        <div style={{ marginTop: '28px', marginBottom: '28px' }}>
          <div style={{ color: '#C8311E', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '13px', fontWeight: '800' }}>Step 01 / Registration open</div>
          <h1 className="mm-display" style={{ fontSize: 'clamp(48px, 9vw, 108px)', lineHeight: 0.86, margin: '12px 0' }}>ILCA Mexican Midwinter Regatta 2027</h1>
          <p style={{ fontSize: '18px', opacity: 0.78, maxWidth: '760px' }}>Register one or multiple sailors in a single secure checkout. Entry is <strong>$100 USD per sailor</strong>; charter/facility-use add-ons are selected per sailor.</p>
        </div>

        <form onSubmit={submit} style={{ background: '#FFFBF2', border: '1px solid rgba(14,17,22,0.14)', borderRadius: '4px', padding: '24px', boxShadow: '0 18px 50px rgba(14,17,22,0.12)' }}>
          <h2 className="mm-display" style={{ marginTop: 0, marginBottom: '16px', fontSize: '34px', lineHeight: 0.95 }}>Purchaser / primary contact</h2>
          <div style={gridStyle}>
            <Field label="Purchaser name *"><input style={fieldStyle} value={purchaser.fullName} onChange={e => updatePurchaser('fullName', e.target.value)} required /></Field>
            <Field label="Purchaser email *"><input type="email" style={fieldStyle} value={purchaser.email} onChange={e => updatePurchaser('email', e.target.value)} required /></Field>
            <Field label="Phone"><input style={fieldStyle} value={purchaser.phone} onChange={e => updatePurchaser('phone', e.target.value)} placeholder="Optional" /></Field>
            <Field label="WhatsApp number *" help="Include country code. Example: 19178675309"><input style={fieldStyle} value={purchaser.whatsapp} onChange={e => updatePurchaser('whatsapp', e.target.value)} required /></Field>
            <Field label="Emergency contact name *"><input style={fieldStyle} value={purchaser.emergencyContactName} onChange={e => updatePurchaser('emergencyContactName', e.target.value)} required /></Field>
            <Field label="Emergency contact phone *"><input style={fieldStyle} value={purchaser.emergencyContactPhone} onChange={e => updatePurchaser('emergencyContactPhone', e.target.value)} required /></Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginTop: '32px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h2 className="mm-display" style={{ margin: 0, fontSize: '34px', lineHeight: 0.95 }}>Sailors</h2>
            <button type="button" onClick={addSailor} style={{ background: '#C8311E', color: '#F4EDDF', border: 'none', borderRadius: '3px', padding: '11px 16px', fontWeight: 900, cursor: 'pointer' }} className="mm-btn">+ Add another sailor</button>
          </div>

          {sailors.map((sailor, index) => (
            <section key={index} style={{ marginTop: index ? '22px' : 0, padding: '18px', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '3px', background: '#F4EDDF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h3 className="mm-display" style={{ margin: 0, fontSize: '28px', lineHeight: 0.95 }}>Sailor {index + 1}</h3>
                  <AddOnSummary sailor={sailor} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => duplicateSailor(index)} style={{ background: 'transparent', color: '#C8311E', border: '1px solid rgba(99,179,237,0.45)', borderRadius: '8px', padding: '9px 12px', fontWeight: 800 }}>Duplicate</button>
                  {sailors.length > 1 && <button type="button" onClick={() => removeSailor(index)} style={{ background: 'transparent', color: '#C8311E', border: '1px solid rgba(200,49,30,0.28)', borderRadius: '3px', padding: '9px 12px', fontWeight: 800 }}>Remove</button>}
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
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', background: '#FFFBF2' }}><input type="checkbox" checked={sailor.proKitRental} onChange={e => updateSailor(index, 'proKitRental', e.target.checked)} style={{ marginTop: '4px' }} /><span><strong>Pro Kit Rental — $75</strong><br /><small style={{ opacity: 0.7 }}>Full rigging & carbon tiller/extension. Does not include sail or battens.</small></span></label>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', background: '#FFFBF2' }}><input type="checkbox" checked={sailor.boatInsurance} onChange={e => updateSailor(index, 'boatInsurance', e.target.checked)} style={{ marginTop: '4px' }} /><span><strong>Boat Insurance — $80</strong><br /><small style={{ opacity: 0.7 }}>Damage protection for charter equipment.</small></span></label>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '3px', background: '#FFFBF2' }}><input type="checkbox" checked={sailor.sailBattenRental} onChange={e => updateSailor(index, 'sailBattenRental', e.target.checked)} style={{ marginTop: '4px' }} /><span><strong>Sail + Batten Rental — $150</strong><br /><small style={{ opacity: 0.7 }}>Rental sail and battens for the selected rig.</small></span></label>
              </div>

              <div style={{ ...gridStyle, marginTop: '18px' }}>
                <Field label="Pertinent medical conditions"><textarea style={{ ...fieldStyle, minHeight: '90px' }} value={sailor.medicalConditions} onChange={e => updateSailor(index, 'medicalConditions', e.target.value)} /></Field>
                <Field label="Notes"><textarea style={{ ...fieldStyle, minHeight: '90px' }} value={sailor.notes} onChange={e => updateSailor(index, 'notes', e.target.value)} placeholder="Anything race office should know..." /></Field>
              </div>

              <div style={{ marginTop: '14px', textAlign: 'right', color: '#C8311E', fontWeight: 900 }}>Sailor subtotal: {money(sailorTotalCents(sailor))}</div>
            </section>
          ))}

          <div style={{ marginTop: '24px', padding: '18px', borderRadius: '3px', background: '#0E1116', color: '#F4EDDF', border: '1px solid rgba(14,17,22,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div><strong>Checkout summary</strong><div style={{ opacity: 0.68, marginTop: '4px' }}>{sailors.length} sailor{sailors.length === 1 ? '' : 's'} • one Stripe payment</div></div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: '#C8311E' }}>{money(total)}</div>
            </div>
          </div>

          <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '18px', color: 'rgba(14,17,22,0.82)', lineHeight: 1.5 }}><input type="checkbox" checked={waiverAccepted} onChange={e => setWaiverAccepted(e.target.checked)} required style={{ marginTop: '5px' }} /><span>I understand this registration is for all listed sailors and selected add-ons. We’ll follow event rules, safety requirements, and race-office instructions.</span></label>

          {error && <div style={{ marginTop: '18px', padding: '14px', borderRadius: '3px', background: 'rgba(200,49,30,0.10)', border: '1px solid rgba(229,62,62,0.35)', color: '#C8311E' }}>{error}{error.includes('Stripe is not configured') && <div style={{ marginTop: '8px' }}><a href={REGATTA_REGISTER_FALLBACK_URL} style={{ color: '#C8311E' }}>Use FareHarbor fallback for now →</a></div>}</div>}

          <button type="submit" disabled={loading} className="mm-btn" style={{ marginTop: '24px', width: '100%', padding: '18px 22px', borderRadius: '3px', border: 'none', background: loading ? '#5C6470' : '#C8311E', color: '#F4EDDF', fontFamily: 'var(--mm-display)', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '0.02em', fontWeight: '900', fontSize: '24px', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Opening secure checkout…' : `Continue to payment — ${money(total)}`}</button>
        </form>
      </div>
    </main>
  )
}
