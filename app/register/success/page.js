const WHATSAPP_GROUP_URL = '/join-whatsapp'

export default function RegistrationSuccessPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a192f', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '680px', textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,179,237,0.32)', borderRadius: '18px', padding: '36px' }}>
        <div style={{ fontSize: '52px', color: '#68d391', marginBottom: '12px' }}>✓</div>
        <h1 style={{ fontSize: '34px', margin: '0 0 12px' }}>Registration received</h1>
        <p style={{ fontSize: '18px', opacity: 0.78, lineHeight: 1.6 }}>Thanks — your payment is complete. You’ll appear on the sailor list after Stripe confirms the payment, usually within a few seconds.</p>
        <div style={{ marginTop: '24px', padding: '18px', borderRadius: '12px', background: 'rgba(99,179,237,0.1)', border: '1px solid rgba(99,179,237,0.28)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>Join the regatta WhatsApp group</h2>
          <p style={{ margin: '0 0 14px', opacity: 0.78, lineHeight: 1.5 }}>We’ll use this group for race-office updates, logistics, and sailor notices.</p>
          <a href={WHATSAPP_GROUP_URL} style={{ display: 'inline-block', background: '#25D366', color: '#062414', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '900' }}>Join WhatsApp group</a>
        </div>
        <a href="/?tab=sailors" style={{ display: 'inline-block', marginTop: '22px', background: '#63b3ed', color: '#0a192f', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '800' }}>View sailor list</a>
      </div>
    </main>
  )
}
