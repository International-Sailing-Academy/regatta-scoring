const WHATSAPP_GROUP_URL = '/join-whatsapp'

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Antonio:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');`

export default function RegistrationSuccessPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0E1116', color: '#F4EDDF', fontFamily: 'Space Grotesk, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{fontImport}</style>
      <div style={{ maxWidth: '680px', textAlign: 'center', background: '#FFFBF2', color: '#0E1116', border: '1px solid rgba(244,237,223,0.24)', borderRadius: '4px', padding: '36px', boxShadow: '0 24px 70px rgba(0,0,0,0.28)', borderTop: '8px solid #C8311E' }}>
        <div style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', letterSpacing: '0.22em', textTransform: 'uppercase', fontSize: '11px', color: '#C8311E', marginBottom: '14px' }}>Payment complete</div>
        <h1 style={{ fontFamily: 'Antonio, Impact, sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontSize: 'clamp(42px, 8vw, 76px)', lineHeight: 0.9, margin: '0 0 12px' }}>Registration received</h1>
        <p style={{ fontSize: '18px', opacity: 0.78, lineHeight: 1.6 }}>Thanks — your payment is complete. You’ll appear on the sailor list after Stripe confirms the payment, usually within a few seconds.</p>
        <div style={{ marginTop: '24px', padding: '18px', borderRadius: '3px', background: '#0E1116', color: '#F4EDDF', border: '1px solid rgba(14,17,22,0.28)' }}>
          <h2 style={{ fontFamily: 'Antonio, Impact, sans-serif', fontStyle: 'italic', textTransform: 'uppercase', margin: '0 0 8px', fontSize: '30px' }}>Join the regatta WhatsApp group</h2>
          <p style={{ margin: '0 0 14px', opacity: 0.78, lineHeight: 1.5 }}>We’ll use this group for race-office updates, logistics, and sailor notices.</p>
          <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#25D366', color: '#062414', padding: '12px 20px', borderRadius: '3px', textDecoration: 'none', fontWeight: '900' }}>Join WhatsApp group</a>
        </div>
        <a href="/?tab=sailors" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '22px', background: '#C8311E', color: '#F4EDDF', padding: '13px 22px', borderRadius: '3px', textDecoration: 'none', fontFamily: 'Antonio, Impact, sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontWeight: '800', fontSize: '20px' }}>View sailor list</a>
      </div>
    </main>
  )
}
