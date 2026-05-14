import NavBar from '../_components/landing/NavBar'
import Wordmark from '../_components/landing/Wordmark'
import FaqAccordion from '../_components/landing/FaqAccordion'
import Comparison from '../_components/landing/Comparison'

export const metadata = {
  title: 'Pricing — ServiceMind',
  description: 'Pay for what you send. $0.05 per text, $5 in starter credit, no subscription.',
}

const EXAMPLES = [
  {
    title: 'Solo barber, 5 customers/day',
    monthlySms: 350,
    monthly: '$17.50',
    sub: '~350 outbound texts a month',
  },
  {
    title: 'Working shop, 10 customers/day',
    monthlySms: 700,
    monthly: '$35.00',
    sub: '~700 outbound texts a month',
    highlight: true,
  },
  {
    title: 'Busy shop, 20 customers/day',
    monthlySms: 1400,
    monthly: '$70.00',
    sub: '~1,400 outbound texts a month',
  },
]

const INCLUDED = [
  'Branded booking page (10 templates)',
  'AI receptionist in SMS — books, reschedules, answers',
  'Booking confirmations + 24-hour reminders',
  'Missed-call text-back',
  'Win-back automations for dormant clients',
  'Slow-day fillers',
  'Post-visit review requests',
  'Weekly business advisor (AI reads your numbers)',
  'Unlimited inbound texts (we eat the cost)',
  'Dashboard + analytics',
]

const FAQ = [
  {
    q: 'How does the $5 starter credit work?',
    a: 'When the payment system launches (alongside A2P clearance), every new signup gets $5 of credit on the house. That covers your first 100 outbound texts at $0.05 each — usually 2-4 weeks for a solo shop. No card required. Once the credit runs out, you decide if you want to top up. Early-access signups today reserve their spot — your $5 lands the moment payments are live.',
  },
  {
    q: 'What counts as an outbound text?',
    a: 'Every SMS message we send to a customer on your behalf — booking confirmations, reminders, AI receptionist replies, win-backs, missed-call text-backs. One message = one charge. We do NOT charge for inbound (when your customer texts you back) — those are on us.',
  },
  {
    q: 'How do I top up?',
    a: 'From the dashboard, in two clicks. Minimum top-up is $10. We support auto-recharge when your balance dips below a threshold you set, so you never run dry mid-day. Pay with any card — no contract, no subscription, no commitment.',
  },
  {
    q: 'Are there per-booking fees?',
    a: 'No. We do not take a cut of bookings, services, or tips. Whatever the client pays, you keep 100% of. Our only revenue is the $0.05 per text you send.',
  },
  {
    q: 'What if I cancel?',
    a: 'There\'s nothing to cancel — there\'s no subscription. Just stop topping up. Any unused credit stays in your account in case you come back. Export your clients and appointments to CSV anytime from the dashboard.',
  },
  {
    q: 'How does this compare to Booksy, Squire, or Vagaro?',
    a: 'Most competitors charge a flat $30–$100/mo PLUS per-booking fees that add up fast on a busy shop. A 100-cut/month shop on Booksy typically pays $60–$100 effective. ServiceMind\'s same shop sending ~700 texts pays $35. We undercut on cost AND include the AI receptionist they don\'t have.',
  },
  {
    q: 'Is there a higher tier for bigger shops?',
    a: 'Coming soon. A $30/mo Pro tier with priority AI quality, custom branding, and higher SMS throughput for multi-chair shops. Launching once the AI receptionist is best-in-class. For now, $0.05/SMS scales fine for shops up to ~1,500 texts/month.',
  },
]

export default function PricingPage() {
  return (
    <div className="marketing">
      <NavBar />

      {/* EARLY ACCESS BANNER ─────────────────────── */}
      <div style={{ background: 'var(--ink-0)', color: 'var(--brand)', padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 500, letterSpacing: '0.02em' }}>
        Early access · Payment system launches with A2P-cleared SMS · Pricing shown is the launch model
      </div>

      {/* HERO ────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 80, paddingBottom: 'var(--space-section-md)' }}>
        <div className="container">
          <div style={{ maxWidth: 780 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 20 }}>Pricing at launch</div>
            <h1 style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 24 }}>
              Pay for what you send.<br />
              <span style={{ color: 'var(--brand)' }}>Nothing else.</span>
            </h1>
            <p style={{ fontSize: 20, color: 'var(--ink-2)', opacity: 0.8, lineHeight: 1.5, maxWidth: 640 }}>
              $0.05 per text, $5 in starter credit at launch, no subscription. No per-booking fees, no contracts, no cards required to start.
            </p>
            <div style={{ marginTop: 36, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="/onboard"
                style={{
                  background: 'var(--brand)',
                  color: '#fff',
                  padding: '16px 28px',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  display: 'inline-block',
                }}
              >
                Join early access →
              </a>
              <span style={{ fontSize: 14, color: 'var(--ink-4)' }}>No card required · 5-minute setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE NUMBERS ─────────────────────────────── */}
      <section className="section section--light">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16 }}>The numbers</div>
            <h2>One price. No fine print.</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { big: '$0.05', label: 'Per outbound text', sub: 'One flat per-message rate. Same for confirmations, reminders, AI replies, anything we send.' },
              { big: '$5', label: 'Starter credit', sub: 'On the house when you sign up — covers ~100 texts. No card needed.', highlight: true },
              { big: '$0', label: 'Subscription, booking fees, contracts', sub: 'Nothing recurring. Top up when you want. Walk away anytime — your credit stays.' },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: card.highlight ? 'var(--brand-tint)' : 'var(--ink-7)',
                  border: card.highlight ? '1px solid var(--brand)' : '1px solid var(--ink-5)',
                  borderRadius: 12,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 'clamp(40px, 5vw, 56px)', fontWeight: 700, color: card.highlight ? 'var(--brand)' : 'var(--ink-0)', lineHeight: 1, letterSpacing: '-0.03em' }}>
                  {card.big}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', marginTop: 12, marginBottom: 8 }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-2)', opacity: 0.75, lineHeight: 1.5 }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL-WORLD EXAMPLES ─────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16 }}>Real shops, real math</div>
            <h2>What you&rsquo;d actually pay.</h2>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', opacity: 0.7, marginTop: 12 }}>
              Assumes the average shop sends ~3 texts per customer (confirmation + 24-hr reminder + 1 conversational reply via AI receptionist).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {EXAMPLES.map((ex, i) => (
              <div
                key={i}
                style={{
                  background: ex.highlight ? 'var(--ink-0)' : 'var(--ink-7)',
                  color: ex.highlight ? 'var(--ink-7)' : 'var(--ink-0)',
                  border: ex.highlight ? '1px solid var(--ink-0)' : '1px solid var(--ink-5)',
                  borderRadius: 12,
                  padding: 28,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: ex.highlight ? 'var(--brand)' : 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  {ex.title}
                </div>
                <div style={{ fontSize: 'clamp(36px, 4.5vw, 48px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {ex.monthly}
                  <span style={{ fontSize: 18, fontWeight: 400, opacity: 0.5, marginLeft: 6 }}>/ mo</span>
                </div>
                <div style={{ fontSize: 14, opacity: 0.75, marginTop: 12 }}>
                  {ex.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED ─────────────────────────── */}
      <section className="section section--light">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16 }}>What&rsquo;s included</div>
            <h2>Every feature, for everyone.</h2>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', opacity: 0.7, marginTop: 12 }}>
              No tiers, no &ldquo;upgrade to unlock,&rdquo; no add-ons. You only pay for the SMS you actually send.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {INCLUDED.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'var(--ink-7)',
                  border: '1px solid var(--ink-5)',
                  borderRadius: 8,
                  fontSize: 14,
                  color: 'var(--ink-1)',
                  fontWeight: 500,
                }}
              >
                <span style={{ color: 'var(--brand)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON ──────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16 }}>How we stack up</div>
            <h2>Cheaper than the booking platforms. With the AI they don&rsquo;t have.</h2>
          </div>
          <Comparison />
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 24, opacity: 0.8 }}>
            Competitor pricing reflects publicly listed rates as of 2026. Booksy effective cost includes typical per-booking fees on a 100-cut/month shop.
          </div>
        </div>
      </section>

      {/* FAQ ─────────────────────────────────────── */}
      <section className="section section--light">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16, justifyContent: 'center', display: 'flex' }}>Pricing questions</div>
            <h2>The fine print, without the fine print.</h2>
          </div>
          <FaqAccordion items={FAQ} />
        </div>
      </section>

      {/* CTA BAND ────────────────────────────────── */}
      <section style={{ background: 'var(--brand)', padding: '56px 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--ink-0)', fontSize: 'clamp(28px, 4vw, 40px)' }}>Reserve your spot. No card. 5-minute setup.</h2>
          <a
            href="/onboard"
            style={{
              background: 'var(--ink-0)',
              color: '#fff',
              padding: '16px 32px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Join early access →
          </a>
          <span style={{ fontSize: 13, color: 'rgba(14, 16, 20, 0.7)' }}>Early access · $5 starter credit applied at launch · No subscription</span>
        </div>
      </section>

      {/* FOOTER ──────────────────────────────────── */}
      <footer style={{ background: 'var(--ink-1)', borderTop: '1px solid var(--ink-3)', padding: '48px 0 24px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Wordmark size={20} />
            <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>
              <a href="/" style={{ color: 'var(--ink-5)', marginRight: 16 }}>Home</a>
              <a href="/privacy" style={{ color: 'var(--ink-5)', marginRight: 16 }}>Privacy</a>
              <a href="/terms" style={{ color: 'var(--ink-5)' }}>Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
