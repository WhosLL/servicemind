import '../globals.css'

export const metadata = {
  title: 'Privacy Policy — ServiceMind',
  description: 'ServiceMind Privacy Policy.'
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', color: 'var(--text-2)', fontSize: 14, lineHeight: 1.9 }}>
        <a href="/" className="btn-ghost" style={{ marginBottom: 36, fontSize: 10, display: 'inline-block' }}>← Back to Home</a>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Legal</div>
        <h1 className="cormorant" style={{ fontSize: 48, fontWeight: 300, marginBottom: 32 }}>Privacy Policy</h1>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 32 }}>Last updated: April 2026</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>What we collect</h2>
        <p>As a ServiceMind user (shop owner): your email, shop name, phone number, service list, appointments, and client data. As a client booking through a ServiceMind page: your name, phone number, and booking history with that specific shop.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>How we use it</h2>
        <p>To provide the booking service, send transactional SMS (confirmations, reminders), and allow you to manage your clients. We do not use your data for anything else.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>Who we share it with</h2>
        <p>Subprocessors we use to operate the service: Supabase (database), Vercel (hosting), Twilio (SMS), Anthropic (AI features). We never sell your data.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>Your rights</h2>
        <p>Access your data anytime via your dashboard. Request deletion by canceling your account. Clients can request their booking data by contacting the shop they booked with, or us directly.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>SMS &amp; TCPA</h2>
        <p>Clients who book through a ServiceMind booking page receive transactional SMS (confirmations, reminders) from that shop's assigned phone number. Marketing SMS (win-back offers, birthday specials, promotions) is only sent to clients who explicitly opt in via the booking-page consent checkbox. Reply STOP to opt out at any time, or HELP for assistance. Msg &amp; data rates may apply; msg frequency varies.</p>
        <p style={{ marginTop: 12 }}><strong style={{ color: 'var(--text)' }}>We do not share opted-in mobile information with third parties or affiliates for marketing or promotional purposes.</strong> Mobile opt-in data and consent records are kept only for the purpose of delivering and managing the SMS service.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>Data retention</h2>
        <p>We retain your data for as long as your account is active. After cancellation, data is preserved for 30 days (for restore) then permanently deleted.</p>

        <h2 className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--gold)', margin: '32px 0 12px' }}>Contact</h2>
        <p>Privacy questions? Reach us through your dashboard or via the contact info in your billing email.</p>
      </div>
    </div>
  )
}
