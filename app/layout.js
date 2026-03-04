export const metadata = {
  title: 'ILCA Mexican Midwinter Regatta 2026',
  description: 'International Sailing Academy - March 19-21, 2026',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
