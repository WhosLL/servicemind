import NavBar from '../_components/landing/NavBar'
import Wordmark from '../_components/landing/Wordmark'
import { TEMPLATE_LIST } from '../../lib/templates'

export const metadata = {
  title: 'Booking page templates — ServiceMind',
  description: 'Browse the booking page templates. Every shop gets a branded page in under five minutes — pick a look, drop in your services, share the link.',
}

// Real, onboarded shops we can link to as live examples (by template id).
const LIVE_EXAMPLE = {
  luxury: 'boo-cutz',
  beach: 'bella-s-salon-f3t0',
}

// Sample services shown inside each preview card.
const SAMPLE_SERVICES = [
  { name: 'Signature Haircut', dur: '45 min', price: '$40' },
  { name: 'Taper Fade', dur: '45 min', price: '$45' },
  { name: 'Beard Line Up', dur: '20 min', price: '$25' },
]

function fontStack(f, fallback) {
  return `'${f}', ${fallback}`
}

function TemplatePreview({ t }) {
  const c = t.colors
  const f = t.fonts
  const st = t.style || {}
  const radius = st.buttonRadius ?? 8
  const upper = !!st.uppercase
  const display = fontStack(f.display, f.displayFallback)
  const body = fontStack(f.body, f.bodyFallback)

  return (
    <div
      aria-hidden="true"
      style={{
        background: (t.decoration && t.decoration.bgGradient) || c.bg,
        backgroundColor: c.bg,
        padding: '28px 22px 24px',
        minHeight: 360,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: body,
        color: c.text,
      }}
    >
      {/* Shop header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '.28em', color: c.muted, fontFamily: fontStack(f.ui, f.uiFallback), textTransform: 'uppercase', marginBottom: 8 }}>
          ServiceMind
        </div>
        <div
          style={{
            fontFamily: display,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: st.letterSpacingDisplay || '.04em',
            textTransform: upper ? 'uppercase' : 'none',
            color: c.text,
            lineHeight: 1.1,
          }}
        >
          Your Shop
        </div>
        <div style={{ fontSize: 11, color: c.muted, marginTop: 6, letterSpacing: '.04em' }}>
          barbershop · Raleigh · NC
        </div>
      </div>

      {/* Services */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <div style={{ fontSize: 9, letterSpacing: '.22em', color: c.muted, textTransform: 'uppercase', marginBottom: 2 }}>
          Select a service
        </div>
        {SAMPLE_SERVICES.map((s) => (
          <div
            key={s.name}
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: radius >= 999 ? 14 : Math.min(radius + 6, 12),
              padding: '11px 13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: c.muted, marginTop: 2 }}>{s.dur}</div>
            </div>
            <div style={{ fontSize: 13, color: c.accent, fontWeight: 600 }}>{s.price}</div>
          </div>
        ))}
      </div>

      {/* Button */}
      <div
        style={{
          background: c.accent,
          color: c.accentInk,
          textAlign: 'center',
          padding: '12px',
          borderRadius: radius,
          fontFamily: fontStack(f.ui, f.uiFallback),
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: upper ? '.14em' : '.02em',
          textTransform: upper ? 'uppercase' : 'none',
        }}
      >
        Pick a time →
      </div>
    </div>
  )
}

function TemplateCard({ t }) {
  const live = LIVE_EXAMPLE[t.id]
  return (
    <div
      style={{
        background: 'var(--ink-1)',
        border: '1px solid var(--ink-3)',
        borderRadius: 'var(--r-lg, 16px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TemplatePreview t={t} />
      <div style={{ padding: '18px 18px 20px', borderTop: '1px solid var(--ink-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <h3 style={{ fontSize: 17, color: 'var(--ink-6)', margin: 0 }}>{t.name}</h3>
          <div style={{ display: 'flex', gap: 5 }}>
            {(t.swatchColors || []).map((sc, i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: sc, border: '1px solid rgba(255,255,255,0.15)' }} />
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-5)', lineHeight: 1.5, margin: '0 0 16px' }}>{t.description}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {live ? (
            <a href={`/book/${live}`} className="btn-secondary" style={{ padding: '9px 16px', fontSize: 13 }}>
              See it live →
            </a>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--ink-4)', alignSelf: 'center' }}>Preview above</span>
          )}
          <a href="/onboard" className="btn-primary" style={{ padding: '9px 16px', fontSize: 13 }}>
            Use this template
          </a>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  return (
    <div className="marketing">
      <NavBar />

      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="eyebrow-mono" style={{ marginBottom: 16 }}>Booking page templates</div>
          <h1 style={{ marginBottom: 18, maxWidth: 720 }}>Pick a look. Your page goes live in five minutes.</h1>
          <p style={{ fontSize: 18, color: 'var(--ink-5)', maxWidth: 600, lineHeight: 1.6, marginBottom: 12 }}>
            Every ServiceMind shop gets a branded booking page. Choose one of the templates below, drop in your
            services and hours, and share the link — no app, no account for your clients.
          </p>
          <p style={{ fontSize: 13, color: 'var(--ink-4)', marginBottom: 40 }}>
            {TEMPLATE_LIST.length} templates · fully customizable colors, photos, and services
          </p>

          <div className="template-grid">
            {TEMPLATE_LIST.map((t) => (
              <TemplateCard key={t.id} t={t} />
            ))}
          </div>

          <div style={{ marginTop: 56, textAlign: 'center', padding: '40px 24px', background: 'var(--ink-1)', border: '1px solid var(--ink-3)', borderRadius: 'var(--r-lg, 16px)' }}>
            <h2 style={{ fontSize: 26, color: 'var(--ink-6)', marginBottom: 12 }}>Make one yours.</h2>
            <p style={{ fontSize: 15, color: 'var(--ink-5)', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Start free for 30 days. Your branded page and SMS receptionist are live the same afternoon.
            </p>
            <a href="/onboard" className="btn-primary btn-primary--lg">Start free for 30 days</a>
          </div>
        </div>
      </section>

      <footer style={{ background: 'var(--ink-1)', borderTop: '1px solid var(--ink-3)', padding: '48px 0 24px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <Wordmark size={20} />
            <span style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <a href="/" style={{ color: 'var(--ink-5)' }}>Home</a>
              <a href="/onboard" style={{ color: 'var(--brand)' }}>Start Free →</a>
            </span>
          </div>
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--ink-3)', fontSize: 12, color: 'var(--ink-4)' }}>
            © 2026 ServiceMind
          </div>
        </div>
      </footer>

      <style>{`
        .marketing .template-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) { .marketing .template-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .marketing .template-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
