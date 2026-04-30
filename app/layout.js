import './globals.css'

export const metadata = {
  title: 'ServiceMind — The AI Booking Platform Built for Barbers',
  description: 'Your own branded booking page, SMS confirmations, AI that fills slow days — all for $79/mo. First month free, no card required.',
  metadataBase: new URL('https://servicemind.io'),
  openGraph: {
    title: 'ServiceMind — The AI Booking Platform Built for Barbers',
    description: 'Your own branded booking page, SMS confirmations, AI that fills slow days. $79/mo. First month free, no card.',
    url: 'https://servicemind.io',
    siteName: 'ServiceMind',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ServiceMind — The AI Booking Platform Built for Barbers',
    description: 'Your own branded booking page, SMS confirmations, AI that fills slow days. $79/mo. First month free, no card.',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
