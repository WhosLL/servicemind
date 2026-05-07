import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NavBar from './_components/landing/NavBar'
import Wordmark from './_components/landing/Wordmark'
import HeroSmsMockup from './_components/landing/HeroSmsMockup'
import BookingPageMockup from './_components/landing/BookingPageMockup'
import ReminderThreadMockup from './_components/landing/ReminderThreadMockup'
import DashboardMockup from './_components/landing/DashboardMockup'
import FaqAccordion from './_components/landing/FaqAccordion'
import Comparison from './_components/landing/Comparison'

const TRUST_CHIPS = [
  ['30 Day', 'Free Trial'],
  ['No Card', 'Required'],
  ['5 Min', 'Setup'],
  ['$49', 'Flat — No Booking Fees'],
]

const PILLARS = [
  {
    eyebrow: 'A',
    title: 'Your booking page, branded like your shop',
    body: 'Pick a template, drop in your services and hours, and your booking page is live in under five minutes. Your colors, your photos, your link. Goes straight in your Instagram bio — no app download for clients, no account to create.',
    visual: 'booking',
  },
  {
    eyebrow: 'B',
    title: 'An AI receptionist that lives in the text thread',
    body: "Clients reply to a reminder. The AI reschedules, cancels, or answers their question right inside the same text thread — no portal, no link to chase. Miss a call mid-fade? It texts the caller back, qualifies them, and books the slot before you're done.",
    visual: 'reminder',
  },
  {
    eyebrow: 'C',
    title: 'Seven automations on autopilot',
    body: '24-hour reminders, 1-hour reminders, win-backs for clients who haven\'t been in for 60 days, slow-day fillers, missed-call text-back, post-visit review requests, and a weekly business advisor that reads your numbers and tells you what to do next. Set once. Runs forever.',
    visual: 'dashboard',
  },
]

const STEPS = [
  {
    n: '1',
    title: 'Sign up in 5 minutes',
    body: 'Drop in your shop name, services, hours, and your number. Pick a template. Your branded booking page goes live and your business number gets wired up for two-way SMS. No installer, no rep call.',
  },
  {
    n: '2',
    title: 'Share the link. Clients book themselves.',
    body: "Your link goes in your Instagram bio, your Google profile, your business cards. Clients tap, pick a service, pick a time, get an instant SMS confirmation. You see the booking on your phone before they've put theirs down.",
  },
  {
    n: '3',
    title: 'The AI handles the rest in SMS',
    body: 'Reminders, reschedules, cancellations, missed-call follow-ups, win-backs — all over text, all in your voice. Clients never leave the thread. You stay in the chair. The AI flags anything it can\'t handle so you only see what matters.',
  },
]

const FAQ = [
  {
    q: 'How long does setup actually take?',
    a: 'Under five minutes. You fill out one form — shop name, services, hours, number. Your branded booking page goes live, your SMS number gets wired up, and you can take your first booking the same afternoon. No rep call, no installer.',
  },
  {
    q: 'Do I need a credit card to start the trial?',
    a: "No. Email address only. We don't ask for a card until day 30, and only if you want to keep going. If the trial doesn't earn its keep, you walk — no charge, no friction.",
  },
  {
    q: 'Do you take a cut of bookings or tips?',
    a: "Never. Flat $49/mo. No per-booking fee, no commission on services, no skim on tips. Whatever the client pays, you keep. That's the whole deal.",
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No contracts, no cancellation fee. Cancel from the dashboard in two clicks. Your booking page stays live until your billing period ends, and you can export every client and appointment to a CSV on the way out.',
  },
  {
    q: 'Who is this actually built for?',
    a: 'Solo barbers and small shops first. Also fits estheticians, lash and brow artists, nail techs, laser hair techs, massage therapists, and tattoo artists — any one-to-one service where a client books a chair, a bed, or a station with a specific provider.',
  },
  {
    q: 'What makes the AI receptionist different from Booksy or Squire?',
    a: 'Theirs send your client to an app or a portal. Ours answers inside the SMS thread your client is already in. They text "can I move to Friday" — the AI moves it, confirms it, and never asks them to log in. That single difference is why clients actually use it.',
  },
]

export default function Page() {
  // Server-side redirect for logged-in users
  const cookieStore = cookies()
  const hasAuth = cookieStore.getAll().some((c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
  if (hasAuth) redirect('/dashboard')

  return (
    <div className="marketing">
      <NavBar />

      {/* HERO ──────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 64, paddingBottom: 'var(--space-section-lg)' }}>
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow-mono" style={{ marginBottom: 20 }}>
                Built for solo barbers, estheticians, lash &amp; nail techs, and any chair-based shop
              </div>
              <h1 style={{ marginBottom: 24 }}>Your chair. Your phone. Booked.</h1>
              <p style={{ fontSize: 18, color: 'var(--ink-5)', maxWidth: 540, lineHeight: 1.6, marginBottom: 32 }}>
                A branded booking page plus an SMS-native AI receptionist that books, reschedules, and reminds —
                right inside the text thread your clients already use. No portal. No app to download. No fees per booking.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                <a href="/onboard" className="btn-primary btn-primary--lg">Start free for 30 days</a>
                <a href="/book/leed-barber-shop" className="btn-secondary btn-primary--lg">See a live booking page</a>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 32 }}>
                $49/mo · 30-day free trial · No card required
              </div>

              {/* Trust strip — scroll-snap row of pill chips */}
              <div className="trust-strip">
                {TRUST_CHIPS.map(([head, sub]) => (
                  <div key={head} className="trust-chip">
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-6)' }}>{head}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-visual">
              <HeroSmsMockup width={340} />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT DOES ──────────────────────────────── */}
      <section id="what" className="section section--light">
        <div className="container">
          <div style={{ marginBottom: 56, maxWidth: 720 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16 }}>What ServiceMind does</div>
            <h2 style={{ marginBottom: 16 }}>Three things. Done right.</h2>
            <p style={{ fontSize: 17, color: 'var(--ink-2)', opacity: 0.75 }}>
              No bloat. No 40-tab dashboard. The work that actually keeps your chair full.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 96 }}>
            {PILLARS.map((p, i) => {
              const visual =
                p.visual === 'booking' ? <BookingPageMockup width={280} /> :
                p.visual === 'reminder' ? <ReminderThreadMockup width={280} /> :
                <DashboardMockup width="100%" />
              const reverse = i % 2 === 1
              return (
                <div key={p.eyebrow} className="pillar-row" style={{ flexDirection: reverse ? 'row-reverse' : 'row' }}>
                  <div className="pillar-copy">
                    <div className="eyebrow-mono" style={{ marginBottom: 14 }}>Pillar {p.eyebrow}</div>
                    <h3 style={{ marginBottom: 14 }}>{p.title}</h3>
                    <p style={{ fontSize: 16, color: 'var(--ink-2)', opacity: 0.85, lineHeight: 1.65 }}>{p.body}</p>
                  </div>
                  <div className="pillar-visual">{visual}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS ─────────────────────────────── */}
      <section id="how" className="section">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16 }}>How it works</div>
            <h2>Five minutes to live. Then it runs itself.</h2>
          </div>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="mk-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--brand)',
                    color: '#fff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  {s.n}
                </div>
                <h3 style={{ fontSize: 20 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--ink-5)', lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON ───────────────────────────────── */}
      <section id="pricing" className="section section--light">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16 }}>How we stack up</div>
            <h2>The upgrade everyone&rsquo;s been waiting for.</h2>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', opacity: 0.7, marginTop: 12 }}>
              $49/mo flat, no booking fees. Compared to what you&rsquo;re paying now.
            </p>
          </div>
          <Comparison />
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 24, opacity: 0.8 }}>
            Competitor pricing reflects publicly listed rates as of 2026. Booksy effective cost includes typical per-booking fees on a 100-cut/month shop.
          </div>
        </div>
      </section>

      {/* FAQ ────────────────────────────────────── */}
      <section id="faq" className="section">
        <div className="container">
          <div style={{ marginBottom: 48, maxWidth: 720, textAlign: 'center', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="eyebrow-mono" style={{ marginBottom: 16, justifyContent: 'center', display: 'flex' }}>Questions</div>
            <h2>Straight answers.</h2>
          </div>
          <FaqAccordion items={FAQ} />
        </div>
      </section>

      {/* CTA BAND ──────────────────────────────── */}
      <section style={{ background: 'var(--brand)', padding: '56px 0' }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--ink-0)', fontSize: 'clamp(28px, 4vw, 40px)' }}>Stop chasing reschedules. Start in 5 minutes.</h2>
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
              transition: 'transform 150ms',
            }}
          >
            Start free for 30 days →
          </a>
          <span style={{ fontSize: 13, color: 'rgba(14, 16, 20, 0.7)' }}>$49/mo after trial · No card required</span>
        </div>
      </section>

      {/* FOOTER ─────────────────────────────────── */}
      <footer style={{ background: 'var(--ink-1)', borderTop: '1px solid var(--ink-3)', padding: '48px 0 24px' }}>
        <div className="container">
          <div className="footer-grid">
            <div>
              <Wordmark size={20} />
              <p style={{ fontSize: 13, color: 'var(--ink-4)', marginTop: 12, maxWidth: 280, lineHeight: 1.5 }}>
                Built for the chair. Powered by the thread.
              </p>
            </div>
            <div>
              <div className="eyebrow-mono" style={{ marginBottom: 16 }}>Platform</div>
              <a href="#what" style={{ display: 'block', fontSize: 14, color: 'var(--ink-5)', marginBottom: 10 }}>What it does</a>
              <a href="#pricing" style={{ display: 'block', fontSize: 14, color: 'var(--ink-5)', marginBottom: 10 }}>Pricing</a>
              <a href="/login" style={{ display: 'block', fontSize: 14, color: 'var(--ink-5)', marginBottom: 10 }}>Log in</a>
              <a href="/onboard" style={{ display: 'block', fontSize: 14, color: 'var(--brand)' }}>Start Free →</a>
            </div>
            <div>
              <div className="eyebrow-mono" style={{ marginBottom: 16 }}>Built for</div>
              {['Solo barbers', 'Booth renters', 'Estheticians', 'Lash &amp; brow', 'Nail techs', 'Laser hair', 'Massage', 'Tattoo'].map((l) => (
                <div key={l} style={{ fontSize: 14, color: 'var(--ink-5)', marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: l }} />
              ))}
            </div>
          </div>
          <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--ink-3)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--ink-4)' }}>
            <span>© 2026 ServiceMind</span>
            <span style={{ display: 'flex', gap: 16 }}>
              <a href="/terms" style={{ color: 'var(--ink-4)' }}>Terms</a>
              <a href="/privacy" style={{ color: 'var(--ink-4)' }}>Privacy</a>
            </span>
          </div>
        </div>
      </footer>

      {/* Layout-specific styles */}
      <style>{`
        .marketing .hero-grid {
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 64px;
          align-items: center;
        }
        .marketing .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .marketing .trust-strip {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 4px;
          margin-left: -4px;
          padding-left: 4px;
        }
        .marketing .trust-strip::-webkit-scrollbar { display: none; }
        .marketing .trust-strip { scrollbar-width: none; }
        .marketing .trust-chip {
          flex-shrink: 0;
          scroll-snap-align: start;
          background: var(--ink-1);
          border: 1px solid var(--ink-3);
          border-radius: var(--r-pill);
          padding: 10px 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 130px;
        }
        .marketing .pillar-row {
          display: flex;
          gap: 80px;
          align-items: center;
        }
        .marketing .pillar-copy { flex: 1; }
        .marketing .pillar-visual {
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .marketing .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          position: relative;
        }
        .marketing .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
        }
        @media (max-width: 1024px) {
          .marketing .hero-grid { grid-template-columns: 6fr 6fr; gap: 48px; }
          .marketing .pillar-row { gap: 48px; }
          .marketing .footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
        }
        @media (max-width: 768px) {
          .marketing .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .marketing .pillar-row { flex-direction: column !important; gap: 32px; }
          .marketing .pillar-row .pillar-visual { width: 100%; }
          .marketing .steps-grid { grid-template-columns: 1fr; }
          .marketing .footer-grid { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>
    </div>
  )
}
