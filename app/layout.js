export const metadata = {
  title: 'ISA Regatta Scoring',
  description: 'Sailboat regatta scoring system for ISA',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
