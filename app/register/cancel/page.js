export default function RegistrationCancelPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0A1929', color: '#F2EDE0', fontFamily: 'Manrope, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '620px', textAlign: 'center', background: '#122337', border: '1px solid #1B304A', borderRadius: '4px', padding: '36px' }}>
        <h1 style={{ fontFamily: 'Archivo, system-ui, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', fontSize: '42px', margin: '0 0 12px' }}>Payment canceled</h1>
        <p style={{ fontSize: '18px', opacity: 0.78, lineHeight: 1.6 }}>No charge was made. You can return to the form whenever you’re ready.</p>
        <a href="/register" style={{ display: 'inline-block', marginTop: '22px', background: '#F4A82A', color: '#0A1929', padding: '12px 20px', borderRadius: '4px', textDecoration: 'none', fontWeight: '800' }}>Back to registration</a>
      </div>
    </main>
  )
}
