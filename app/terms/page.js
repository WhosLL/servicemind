import '../globals.css'

export const metadata = {
  title: 'Terms of Service — ServiceMind',
  description: 'ServiceMind Terms of Service.'
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', color: 'var(--text-2)', fontSize: 14, lineHeight: 1.9 }}>
        <a href="/" className="btn-ghost" style={{ marginBottom: 36, fontSize: 10, display: 'inline-block' }}>← Back to Home</a>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Legal</div>
        <h1 className="cormorant" style={{ fontSize: 48, fontWeight: 300, marginBottom: 32 }}>Terms of Service</h1>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 32 }}>Last updated: April 2026</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>1. Acceptance</h2>
        <p>By creating an account or using ServiceMind, you agree to these Terms of Service. If you don't agree, don't use the service.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>2. What ServiceMind Provides</h2>
        <p>ServiceMind is a booking platform for service businesses. We provide a branded booking page, SMS confirmations and reminders via Twilio, client database, and related AI-powered features.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>3. Free Trial</h2>
        <p>New accounts start with a 30-day free trial. No credit card is required to begin. After 30 days, a valid payment method is required to continue. We'll notify you before any charge.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>4. Pricing & Billing</h2>
        <p>Plans are billed monthly. Current pricing: Solo $79/mo, Shop $150/mo, Pro $250/mo. No booking fees. No cut of tips. You can cancel at any time; your account remains active until the end of the current billing period.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>5. Your Data</h2>
        <p>Your bookings, clients, and business data belong to you. We don't sell your data. You can export your data at any time and permanently delete it on cancellation.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>6. SMS Communications</h2>
        <p>ServiceMind sends transactional SMS (booking confirmations, appointment reminders, missed-call replies) and — when the client has explicitly opted in — marketing SMS (win-back offers, birthday specials, promotions) to clients who book through your ServiceMind booking page. Each shop's SMS is sent from its own assigned phone number; the displayed sender is the shop, with ServiceMind as the underlying messaging platform. Msg &amp; data rates may apply. Msg frequency varies. Clients can reply STOP at any time to opt out, or HELP for assistance.</p>
        <p style={{ marginTop: 12 }}>By using ServiceMind, you confirm you have the right to contact your booked clients per TCPA, the CTIA Messaging Principles &amp; Best Practices, and any other applicable law. You agree not to use ServiceMind to send SMS to any individual who has not consented through the booking-page opt-in flow or who has opted out.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>7. Acceptable Use</h2>
        <p>Don't use ServiceMind to send unsolicited marketing SMS, harass clients, or violate any law. We may suspend accounts that do.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>8. Disclaimer</h2>
        <p>ServiceMind is provided "as is." We do our best to keep things working but can't guarantee uptime or data preservation beyond what our backups provide. Export your data regularly.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>9. Changes</h2>
        <p>We may update these Terms. Material changes will be announced in-app or by email 14 days before taking effect.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>10. Contact</h2>
        <p>Questions? Reach us through your dashboard or via the contact info in your billing email.</p>
      </div>
    </div>
  )
}
