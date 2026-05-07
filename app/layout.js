import './globals.css'

export const metadata = {
  title: 'ServiceMind — Your chair. Your phone. Booked.',
  description: 'A branded booking page plus an SMS-native AI receptionist that books, reschedules, and reminds — right inside the text thread your clients already use. $49/mo. 30-day free trial. No card required.',
  metadataBase: new URL('https://servicemind.io'),
  openGraph: {
    title: 'ServiceMind — Your chair. Your phone. Booked.',
    description: 'Branded booking page + SMS-native AI receptionist. Reschedules in-thread, no portal. $49/mo flat.',
    url: 'https://servicemind.io',
    siteName: 'ServiceMind',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'ServiceMind — Your chair. Your phone. Booked.',
    description: 'Branded booking page + SMS-native AI receptionist. Reschedules in-thread. $49/mo.',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500&family=Jost:wght@300;400;500;600;700&family=Oswald:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
