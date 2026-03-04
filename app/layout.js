export const metadata = {
  title: 'ISA Regatta Scoring',
  description: 'Sailboat regatta scoring system for ISA',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
