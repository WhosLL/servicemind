'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../lib/supabase'
import './globals.css'

export default function App() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    sb().auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard')
    }).catch(() => {})
  }, [])

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#080808' }} />
  return <Home onStart={() => router.push('/onboard')} onLogin={() => router.push('/login')} />
}
function Home({ onStart, onLogin }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const joinWaitlist = async () => {
    if (!email) return
    setSubmitting(true)
    await sb().from('waitlist').insert([{ email, name }]).select()
    setSubmitted(true)
    setSubmitting(false)
  }

  const features = [
    { icon: '⚡', tag: 'Instant', title: 'Live in Minutes', body: 'Fill out one form. Your branded booking page, calendar, and SMS confirmations go live automatically. No tech skills, no setup fee.' },
    { icon: '🤖', tag: 'AI-Powered', title: 'AI Booking Agent', body: 'Miss a call? Your AI texts back instantly, qualifies the client, and books the cut while you stay focused on the chair in front of you.' },
    { icon: '📅', tag: 'Automated', title: 'Zero No-Shows', body: 'Smart 24-hour and 1-hour SMS reminders go out automatically. Clients confirm or reschedule with a tap. No-shows drop immediately.' },
    { icon: '💰', tag: 'Revenue', title: 'Slow-Day Deals', body: 'Tuesday looking empty? AI writes a deal, posts to your IG, and texts your regulars. Most shops fill 2-3 extra chairs per week on autopilot.' },
    { icon: '⭐', tag: 'Reputation', title: 'Google Reviews on Autopilot', body: 'Auto-request reviews after every cut. Clients tap through in 10 seconds. Your Google rating climbs while you work.' },
    { icon: '📊', tag: 'Insights', title: 'Business Advisor', body: 'Your AI reads your numbers every week and tells you exactly what to do next — like having a business coach who actually gets the chair.' },
  ]

  const types = [
    { emoji: '✂️', label: 'Solo Barbers' },
    { emoji: '💈', label: 'Barbershops' },
    { emoji: '👥', label: 'Booth Renters' },
    { emoji: '💇', label: 'Hair Salons' },
    { emoji: '💅', label: 'Nail Studios' },
    { emoji: '🎨', label: 'Tattoo Artists' },
  ]

  const plans = [
    {
      name: 'Solo', price: '$79', period: '/mo', hot: true,
      desc: 'For solo barbers and booth renters. One chair, full power.',
      features: ['Your own branded booking page', 'SMS confirmations + reminders', 'AI missed-call text-back', 'Slow-day deal generator', 'Google reviews automation', 'No booking fees, no cut of tips'],
    },
    {
      name: 'Shop', price: '$150', period: '/mo',
      desc: 'For 2-5 chair shops with staff.',
      features: ['Everything in Solo', 'Multi-staff calendar', 'Per-barber booking pages', 'AI business advisor', 'Win-back campaigns', 'Advanced analytics'],
    },
    {
      name: 'Pro', price: '$250', period: '/mo',
      desc: 'For multi-location shops and franchises.',
      features: ['Everything in Shop', 'Multi-location support', 'White-label option', 'Custom AI training', 'API access', 'Priority support'],
    },
  ]

  const faqs = [
    { q: 'How long does setup take?', a: 'Under 5 minutes. Fill out one form with your shop info, services, and hours — your booking page and SMS confirmations go live automatically.' },
    { q: 'Do I need a credit card to start?', a: 'No. Start your 30-day free trial with just an email. We only ask for a card if you decide to keep going after the trial.' },
    { q: 'Do you take a cut of my tips or bookings?', a: 'Never. Flat $79/mo for Solo — no booking fees, no commission on tips, no hidden charges. What clients pay, you keep.' },
    { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no cancellation fees. Your booking page stays up until the end of your billing period. Your data is always yours to export.' },
    { q: 'Will my existing clients have to do anything?', a: 'Nope. Your new booking link drops into your Instagram bio or wherever you share it. Clients just tap and book — no app download, no account creation.' },
    { q: 'Does it work for my shop type?', a: 'Built first for solo barbers and small barbershops. Also works great for hair salons, nail studios, tattoo artists, and booth renters — any chair-based service business.' },
  ]

  const S = {
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '22px 60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-dim)', background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(12px)' },
    section: { padding: '120px 60px' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <div>
          <div className="cinzel" style={{ fontSize: 17, letterSpacing: '.35em', color: 'var(--gold)' }}>ServiceMind</div>
          <div style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 1 }}>The Booking System for Barbers</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 12px', transition: 'color .2s' }}
            onMouseOver={e => e.target.style.color = 'var(--gold)'}
            onMouseOut={e => e.target.style.color = 'var(--muted)'}>Features</a>
          <a href="#pricing" style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 12px', transition: 'color .2s' }}
            onMouseOver={e => e.target.style.color = 'var(--gold)'}
            onMouseOut={e => e.target.style.color = 'var(--muted)'}>Pricing</a>
          <button onClick={onLogin} className="btn-ghost" style={{ padding: '10px 22px', fontSize: 10 }}>Log In</button>
          <button onClick={onStart} className="btn-gold" style={{ padding: '10px 22px', fontSize: 10 }}>Start Free</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '140px 60px 100px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, position: 'relative' }}>
          <div className="eyebrow" style={{ marginBottom: 32 }}>For Solo Barbers &amp; Small Shops</div>
          <h1 className="cormorant" style={{ fontSize: 'clamp(60px,7vw,108px)', fontWeight: 300, lineHeight: 1.0, marginBottom: 36, letterSpacing: '-.01em' }}>
            The Booking<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>System Built</em><br />
            for Barbers.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-2)', lineHeight: 1.9, maxWidth: 540, marginBottom: 56 }}>
            Your own branded booking page, SMS confirmations that feel personal, AI that fills your slow days — all for $79/mo. No booking fees. No cut of your tips. Cancel anytime.
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
            <button onClick={onStart} className="btn-gold" style={{ padding: '18px 52px', fontSize: 12 }}>Start 30-Day Free Trial</button>
            <button onClick={onLogin} className="btn-ghost" style={{ padding: '18px 32px', fontSize: 11 }}>I Already Have an Account</button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', gap: 48, paddingTop: 48, borderTop: '1px solid var(--border-dim)' }}>
            {[['30 Day', 'Free Trial'], ['No Card', 'Required'], ['5 Min', 'Setup'], ['Cancel', 'Anytime']].map(([a, b]) => (
              <div key={b}>
                <div className="cormorant" style={{ fontSize: 30, fontWeight: 300, color: 'var(--gold)', lineHeight: 1 }}>{a}</div>
                <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 4 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SALON TYPES ── */}
      <div style={{ padding: '0 60px 80px' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {types.map(t => (
            <div key={t.label} style={{ flex: 1, background: 'var(--dark-2)', padding: '24px 20px', textAlign: 'center', border: '1px solid var(--border-dim)', cursor: 'default', transition: 'border-color .2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{t.emoji}</div>
              <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ ...S.section, borderTop: '1px solid var(--border-dim)' }}>
        <div style={{ marginBottom: 72 }}>
          <div className="eyebrow" style={{ marginBottom: 24 }}>What ServiceMind Does</div>
          <h2 className="cormorant" style={{ fontSize: 'clamp(40px,4.5vw,72px)', fontWeight: 300, lineHeight: 1.1 }}>
            More than booking.<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Runs your chair for you.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2 }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: '44px 40px', cursor: 'default', transition: 'border-color .3s, transform .2s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.transform = 'none' }}>
              <div style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid var(--border)', padding: '3px 10px' }}>{f.tag}</span>
              </div>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
              <div className="cinzel" style={{ fontSize: 13, letterSpacing: '.12em', color: 'var(--text)', marginBottom: 14 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.85 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI CALLOUT ── */}
      <section style={{ margin: '0 60px', background: 'var(--dark)', border: '1px solid var(--border)', padding: '80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, var(--gold), transparent)' }} />
        <div style={{ position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)', opacity: .04, fontFamily: 'Cinzel', fontSize: 200, fontWeight: 400, color: 'var(--gold)', userSelect: 'none', pointerEvents: 'none' }}>AI</div>
        <div style={{ maxWidth: 600, position: 'relative' }}>
          <div className="eyebrow" style={{ marginBottom: 28 }}>The AI Layer</div>
          <h2 className="cormorant" style={{ fontSize: 'clamp(36px,4vw,64px)', fontWeight: 300, lineHeight: 1.1, marginBottom: 28 }}>
            It books, texts, and fills<br />
            your <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>slow days</em> — automatically.
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.9, marginBottom: 40 }}>
            While you're in the chair, ServiceMind's AI is working. It answers missed calls, confirms bookings by text, nudges no-shows, spots slow days early, and writes promos that actually bring people in.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['AI texts back missed calls and books the appointment in real time', 'AI spots slow days early and writes promo texts to fill your chair', 'AI sends reminder + confirmation SMS that feel like you wrote them', 'AI asks for Google reviews at the perfect moment after every cut'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--gold)', fontSize: 12, marginTop: 2, flexShrink: 0 }}>✦</span>
                <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={S.section}>
        <div style={{ marginBottom: 72 }}>
          <div className="eyebrow" style={{ marginBottom: 24 }}>Pricing</div>
          <h2 className="cormorant" style={{ fontSize: 'clamp(36px,4vw,64px)', fontWeight: 300 }}>
            Simple, flat pricing.<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>No surprises.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, maxWidth: 1100 }}>
          {plans.map((p, i) => (
            <div key={i} style={{ background: p.hot ? 'rgba(201,168,76,.04)' : 'var(--dark)', border: p.hot ? '1px solid var(--gold-dim)' : '1px solid var(--border-dim)', padding: '44px 36px', position: 'relative' }}>
              {p.hot && (
                <div className="cinzel" style={{ position: 'absolute', top: -1, left: 0, right: 0, textAlign: 'center', background: 'var(--gold)', color: 'var(--black)', fontSize: 9, letterSpacing: '.3em', padding: '6px', textTransform: 'uppercase' }}>
                  Most Popular
                </div>
              )}
              <div style={{ marginTop: p.hot ? 20 : 0 }}>
                <div className="cinzel" style={{ fontSize: 12, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 20 }}>{p.name}</div>
                <div className="cormorant" style={{ fontSize: 56, fontWeight: 300, lineHeight: 1, marginBottom: 8 }}>
                  {p.price}<span style={{ fontSize: 18, color: 'var(--muted)' }}>{p.period}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.7 }}>{p.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--gold)', fontSize: 10, marginTop: 2, flexShrink: 0 }}>✦</span>{f}
                    </div>
                  ))}
                </div>
                <button onClick={onStart} className={p.hot ? 'btn-gold' : 'btn-ghost'} style={{ width: '100%', textAlign: 'center' }}>
                  Start 30-Day Free Trial
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WAITLIST / CTA ── */}
      <section style={{ margin: '0 60px 120px', background: 'var(--dark)', border: '1px solid var(--border)', padding: '80px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, var(--gold), transparent)' }} />
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 28, justifyContent: 'center' }}>Get Early Access</div>
          <h2 className="cormorant" style={{ fontSize: 'clamp(36px,4vw,60px)', fontWeight: 300, lineHeight: 1.1, marginBottom: 20 }}>
            Join the waitlist.<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Launch first.</em>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 44 }}>
            Early access members get 30 days free and locked-in pricing for life. Limited spots.
          </p>
          {submitted ? (
            <div style={{ background: 'rgba(39,174,96,.08)', border: '1px solid rgba(39,174,96,.25)', padding: '24px 32px', borderRadius: 'var(--radius)', textAlign: 'center' }}>
              <div className="cinzel" style={{ color: 'var(--green)', fontSize: 11, letterSpacing: '.2em', marginBottom: 8 }}>You're on the list</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>We'll reach out within 24 hours with your early access link.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
              <input className="input" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && joinWaitlist()} />
              <button className="btn-gold" onClick={joinWaitlist} disabled={submitting} style={{ padding: '18px', fontSize: 12, width: '100%', textAlign: 'center', opacity: submitting ? .6 : 1 }}>
                {submitting ? 'Submitting...' : 'Claim Early Access →'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ ...S.section, borderTop: '1px solid var(--border-dim)', paddingBottom: 60 }}>
        <div style={{ marginBottom: 60 }}>
          <div className="eyebrow" style={{ marginBottom: 24 }}>Questions</div>
          <h2 className="cormorant" style={{ fontSize: 48, fontWeight: 300 }}>Frequently asked</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, maxWidth: 1000 }}>
          {faqs.map((f, i) => (
            <div key={i} className="card" style={{ padding: '32px' }}>
              <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.15em', color: 'var(--gold)', marginBottom: 12 }}>{f.q}</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border-dim)', padding: '60px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 60 }}>
        <div>
          <div className="cinzel" style={{ fontSize: 18, letterSpacing: '.35em', color: 'var(--gold)', marginBottom: 6 }}>ServiceMind</div>
          <div style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>The Booking System for Barbers</div>
          <p className="cormorant" style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 280 }}>
            "Every chair deserves a booking system that looks like yours."
          </p>
        </div>
        <div>
          <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 20 }}>Platform</div>
          {['Features', 'Pricing', 'Log In', 'Start Free Trial'].map(l => (
            <div key={l} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, cursor: 'pointer', transition: 'color .2s' }}
              onMouseOver={e => e.target.style.color = 'var(--gold)'}
              onMouseOut={e => e.target.style.color = 'var(--muted)'}
              onClick={() => l === 'Log In' ? onLogin() : l === 'Start Free Trial' ? onStart() : null}>{l}</div>
          ))}
        </div>
        <div>
          <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 20 }}>Built For</div>
          {['Solo Barbers', 'Booth Renters', 'Barbershops', 'Hair Salons', 'Any Chair-Based Shop'].map(l => (
            <div key={l} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{l}</div>
          ))}
        </div>
      </footer>
      <div style={{ borderTop: '1px solid var(--border-dim)', padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>© 2026 ServiceMind · <a href="/terms" style={{ color: 'var(--muted)', textDecoration: 'none', marginLeft: 8 }}>Terms</a> · <a href="/privacy" style={{ color: 'var(--muted)', textDecoration: 'none', marginLeft: 8 }}>Privacy</a></div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Built for the chair</div>
      </div>
    </div>
  )
}
