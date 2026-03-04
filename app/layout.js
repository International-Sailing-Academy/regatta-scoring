export const metadata = {
  title: 'ISA Regatta Scoring',
  description: 'Professional sailboat regatta scoring system - Sailti style',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ 
        margin: 0, 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#f5f5f5',
        minHeight: '100vh'
      }}>
        {children}
      </body>
    </html>
  )
}
