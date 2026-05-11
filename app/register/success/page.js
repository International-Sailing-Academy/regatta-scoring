const WHATSAPP_GROUP_URL = '/join-whatsapp'

export default function RegistrationSuccessPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0A1929', color: '#F2EDE0', fontFamily: 'Manrope, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '680px', textAlign: 'center', background: '#122337', border: '1px solid rgba(244,168,42,0.32)', borderRadius: '4px', padding: '36px' }}>
        <div style={{ fontSize: '52px', color: '#F4A82A', marginBottom: '12px' }}>✓</div>
        <h1 style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', fontSize: '42px', margin: '0 0 12px' }}>Registration received</h1>
        <p style={{ fontSize: '18px', opacity: 0.78, lineHeight: 1.6 }}>Thanks — your payment is complete. You’ll appear on the sailor list after Stripe confirms the payment, usually within a few seconds.</p>
        <div style={{ marginTop: '24px', padding: '18px', borderRadius: '4px', background: 'rgba(244,168,42,0.08)', border: '1px solid rgba(244,168,42,0.28)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>Join the regatta WhatsApp group</h2>
          <p style={{ margin: '0 0 14px', opacity: 0.78, lineHeight: 1.5 }}>We’ll use this group for race-office updates, logistics, and sailor notices.</p>
          <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#25D366', color: '#062414', padding: '12px 20px', borderRadius: '4px', textDecoration: 'none', fontWeight: '900' }}>Join WhatsApp group</a>
        </div>
        <a href="/?tab=sailors" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '22px', background: '#F4A82A', color: '#0A1929', padding: '12px 20px', borderRadius: '4px', textDecoration: 'none', fontWeight: '800' }}>View sailor list</a>
      </div>
    </main>
  )
}
