export const metadata = {
  metadataBase: new URL('https://www.mexicanmidwinters.com'),
  title: 'ILCA Mexican Midwinter Regatta 2027',
  description: 'International Sailing Academy - March 11-13, 2027',
  applicationName: 'Mexican Midwinters',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#F4A82A' },
    ],
  },
  openGraph: {
    title: 'ILCA Mexican Midwinter Regatta 2027',
    description: 'International Sailing Academy - March 11-13, 2027',
    url: 'https://www.mexicanmidwinters.com',
    siteName: 'Mexican Midwinters',
    images: [
      { url: '/og-midwinters-2027.jpg', width: 1200, height: 630, alt: 'ILCA Mexican Midwinter Regatta 2027' },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ILCA Mexican Midwinter Regatta 2027',
    description: 'International Sailing Academy - March 11-13, 2027',
    images: ['/og-midwinters-2027.jpg'],
  },
  other: {
    'msapplication-TileColor': '#0A1929',
    'msapplication-config': '/browserconfig.xml',
  },
}

export const viewport = {
  themeColor: '#0A1929',
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
