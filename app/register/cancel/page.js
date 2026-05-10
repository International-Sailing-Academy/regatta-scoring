export default function RegistrationCancelPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a192f', color: 'white', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '620px', textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '18px', padding: '36px' }}>
        <h1 style={{ fontSize: '34px', margin: '0 0 12px' }}>Payment canceled</h1>
        <p style={{ fontSize: '18px', opacity: 0.78, lineHeight: 1.6 }}>No charge was made. You can return to the form whenever you’re ready.</p>
        <a href="/register" style={{ display: 'inline-block', marginTop: '22px', background: '#63b3ed', color: '#0a192f', padding: '12px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '800' }}>Back to registration</a>
      </div>
    </main>
  )
}
