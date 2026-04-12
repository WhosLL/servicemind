'use client'
import { useState, useEffect, useRef } from 'react'
import { sb } from '../lib/supabase'
import './globals.css'
import Dashboard from './dashboard/page'
import Onboard from './onboard/page'
import Login from './login/page'

export default function App() {
  const [view, setView] = useState('home')
  const [salon, setSalon] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const s = localStorage.getItem('sm_salon')
      if (s) { setSalon(JSON.parse(s)); setView('dashboard') }
    } catch {}
  }, [])

  const login = (s) => {
    setSalon(s)
    localStorage.setItem('sm_salon', JSON.stringify(s))
    setView('dashboard')
  }
  const logout = () => {
    setSalon(null)
    localStorage.removeItem('sm_salon')
    setView('home')
  }

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#080808' }} />
  if (view === 'dashboard' && salon) return <Dashboard salon={salon} onLogout={logout} />
  if (view === 'onboard') return <Onboard onBack={() => setView('home')} onComplete={login} />
  if (view === 'login') return <Login onBack={() => setView('home')} onLogin={login} />
  return <Home onStart={() => setView('onboard')} onLogin={() => setView('login')} />
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
    { icon: '⚡', tag: 'Instant', title: 'Live in Minutes', body: 'Fill out one form. Your branded booking site, calendar, and automations go live automatically. No tech skills needed.' },
    { icon: '🤖', tag: 'AI-Powered', title: 'AI Booking Agent', body: 'Miss a call? Your AI texts back instantly, qualifies the lead, and books the appointment while you focus on the client in your chair.' },
    { icon: '📅', tag: 'Automated', title: 'Zero No-Shows', body: 'Smart 24hr and 1hr reminders sent automatically. Clients confirm or reschedule with a tap. No-show rate drops immediately.' },
    { icon: '💰', tag: 'Revenue', title: 'Win-Back Engine', body: 'When a client hasn\'t visited in 45 days, your AI sends a personalized promo text. Most shops recover 2–3 clients per week on autopilot.' },
    { icon: '⭐', tag: 'Reputation', title: 'Review Control', body: 'Auto-request reviews after every appointment. Read and remove any review you don\'t want. Build your reputation on your terms.' },
    { icon: '📊', tag: 'Insights', title: 'Business Advisor', body: 'Your AI analyzes appointments, revenue, and trends then tells you exactly what to do to grow — like having a business coach on call 24/7.' },
  ]

  const types = [
    { emoji: '✂️', label: 'Barbershops' },
    { emoji: '💅', label: 'Nail Salons' },
    { emoji: '👁', label: 'Lash Studios' },
    { emoji: '💇', label: 'Hair Salons' },
    { emoji: '🧖', label: 'Spas' },
    { emoji: '🎨', label: 'Tattoo Studios' },
  ]

  const plans = [
    {
      name: 'Basic', price: '$150', period: '/mo',
      desc: 'Everything you need to run a modern salon.',
      features: ['Custom booking website', 'AI missed call response', '24hr & 1hr reminders', 'Review automation', 'Win-back campaigns', 'Live dashboard'],
    },
    {
      name: 'Pro', price: '$250', period: '/mo', hot: true,
      desc: 'For shops serious about growth and automation.',
      features: ['Everything in Basic', 'AI business advisor', 'Multi-staff calendar', 'Birthday campaigns', 'VIP outcall booking', 'Advanced analytics', 'Priority support'],
    },
    {
      name: 'Enterprise', price: 'Custom', period: '',
      desc: 'Multi-location chains and white-label agencies.',
      features: ['Everything in Pro', 'Multi-location support', 'Custom AI training', 'White-label option', 'API access', 'Dedicated account manager'],
    },
  ]

  const faqs = [
    { q: 'How long does setup take?', a: 'Under 5 minutes. Fill out one form with your shop info, services, and hours — your full platform goes live automatically.' },
    { q: 'Do I need to know how to code?', a: 'Zero. Everything is built and managed for you. If you can fill out a form, you can run ServiceMind.' },
    { q: 'What happens to my existing bookings?', a: 'We sync with your current calendar or give you a fresh one. Either way, nothing gets lost in the transition.' },
    { q: 'Does it replace GoHighLevel?', a: 'ServiceMind runs on GHL under the hood — but your clients never see it. They just see your brand, your site, your experience.' },
    { q: 'Can I cancel anytime?', a: 'Yes. No contracts, no cancellation fees. Your site stays up until the end of your billing period.' },
    { q: 'Does it work for my salon type?', a: 'ServiceMind is built for any chair-based service business — barbershops, nail salons, lash studios, spas, tattoo studios, and more.' },
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
          <div style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 1 }}>AI Operating System for Salons</div>
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
          <div className="eyebrow" style={{ marginBottom: 32 }}>Introducing ServiceMind</div>
          <h1 className="cormorant" style={{ fontSize: 'clamp(60px,7vw,108px)', fontWeight: 300, lineHeight: 1.0, marginBottom: 36, letterSpacing: '-.01em' }}>
            The AI That<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Runs Your Salon</em><br />
            For You.
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-2)', lineHeight: 1.9, maxWidth: 540, marginBottom: 56 }}>
            One platform. Custom booking site, AI that books appointments, responds to clients, requests reviews, runs campaigns, and advises your business — all without you lifting a finger.
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
            <button onClick={onStart} className="btn-gold" style={{ padding: '18px 52px', fontSize: 12 }}>Start Free Trial</button>
            <button onClick={onLogin} className="btn-ghost" style={{ padding: '18px 32px', fontSize: 11 }}>I Already Have an Account</button>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', gap: 48, paddingTop: 48, borderTop: '1px solid var(--border-dim)' }}>
            {[['14 Day', 'Free Trial'], ['$0', 'Setup Fee'], ['5 Min', 'Setup Time'], ['Cancel', 'Anytime']].map(([a, b]) => (
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
            Not a booking app.<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>An AI operating system.</em>
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
            It books, responds, advises,<br />
            and <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>markets</em> — automatically.
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.9, marginBottom: 40 }}>
            ServiceMind's AI doesn't just automate tasks — it runs your business. It analyzes your numbers, spots slow days before they happen, drafts campaigns, handles every client conversation, and gives you a weekly briefing on what to focus on.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['AI responds to missed calls and books appointments in real time', 'AI analyzes revenue trends and tells you exactly what to do next', 'AI writes and sends your marketing campaigns automatically', 'AI manages every review — request, respond, and remove'].map((item, i) => (
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
                  {p.price === 'Custom' ? 'Contact Us' : 'Start Free Trial'}
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
          <div style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 20 }}>AI Operating System for Salons</div>
          <p className="cormorant" style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--muted)', lineHeight: 1.7, maxWidth: 280 }}>
            "Every chair deserves a platform this powerful."
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
          {['Barbershops', 'Nail Salons', 'Lash Studios', 'Hair Salons', 'Spas & More'].map(l => (
            <div key={l} style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{l}</div>
          ))}
        </div>
      </footer>
      <div style={{ borderTop: '1px solid var(--border-dim)', padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>© 2026 ServiceMind · servicemind.io</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Powered by AI · Built for growth</div>
      </div>
    </div>
  )
}
