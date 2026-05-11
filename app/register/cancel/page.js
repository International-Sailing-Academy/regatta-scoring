const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Antonio:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');`

export default function RegistrationCancelPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0E1116', color: '#F4EDDF', fontFamily: 'Space Grotesk, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <style>{fontImport}</style>
      <div style={{ maxWidth: '620px', textAlign: 'center', background: '#FFFBF2', color: '#0E1116', border: '1px solid rgba(244,237,223,0.24)', borderRadius: '4px', padding: '36px', boxShadow: '0 24px 70px rgba(0,0,0,0.28)', borderTop: '8px solid #C8311E' }}>
        <div style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', letterSpacing: '0.22em', textTransform: 'uppercase', fontSize: '11px', color: '#C8311E', marginBottom: '14px' }}>Checkout paused</div>
        <h1 style={{ fontFamily: 'Antonio, Impact, sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontSize: 'clamp(42px, 8vw, 76px)', lineHeight: 0.9, margin: '0 0 12px' }}>Payment canceled</h1>
        <p style={{ fontSize: '18px', opacity: 0.78, lineHeight: 1.6 }}>No charge was made. You can return to the form whenever you’re ready.</p>
        <a href="/register" style={{ display: 'inline-block', marginTop: '22px', background: '#C8311E', color: '#F4EDDF', padding: '13px 22px', borderRadius: '3px', textDecoration: 'none', fontFamily: 'Antonio, Impact, sans-serif', fontStyle: 'italic', textTransform: 'uppercase', fontWeight: '800', fontSize: '20px' }}>Back to registration</a>
      </div>
    </main>
  )
}
