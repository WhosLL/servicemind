import './globals.css'

export const metadata = {
  title: 'ServiceMind — AI Operating System for Salons',
  description: 'The AI-powered platform that runs your salon. Booking, automations, reviews, and client management — all in one place.',
  metadataBase: new URL('https://servicemind.io'),
  openGraph: {
    title: 'ServiceMind — AI Operating System for Salons',
    description: 'Website, booking, AI automation, and client management for barbershops and salons.',
    url: 'https://servicemind.io',
    siteName: 'ServiceMind',
    type: 'website',
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
