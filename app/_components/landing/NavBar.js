'use client'
import { useEffect, useState } from 'react'
import Wordmark from './Wordmark'

const LINKS = [
  { href: '#what', label: 'What it does' },
  { href: '#how', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(14, 16, 20, 0.92)' : 'rgba(14, 16, 20, 0.7)',
        borderBottom: '1px solid var(--ink-3)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="container"
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Wordmark size={20} />
        </a>
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} style={{ fontSize: 14, color: 'var(--ink-5)', transition: 'color 150ms' }}>
              {l.label}
            </a>
          ))}
          <a href="/login" style={{ fontSize: 14, color: 'var(--ink-5)' }}>
            Log in
          </a>
          <a href="/onboard" className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>
            Start Free
          </a>
        </div>
        <div className="nav-mobile" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
          <a href="/onboard" className="btn-primary" style={{ padding: '8px 14px', fontSize: 13 }}>
            Start Free
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
            style={{ background: 'transparent', border: '1px solid var(--ink-3)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink-5)' }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ display: 'block', width: 16, height: 2, background: 'currentColor' }} />
              <span style={{ display: 'block', width: 16, height: 2, background: 'currentColor' }} />
              <span style={{ display: 'block', width: 16, height: 2, background: 'currentColor' }} />
            </span>
          </button>
        </div>
      </div>
      {/* Mobile drawer */}
      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 220ms ease',
          background: 'var(--ink-1)',
          borderTop: open ? '1px solid var(--ink-3)' : 'none',
        }}
      >
        <div className="container" style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ fontSize: 16, color: 'var(--ink-5)', padding: '8px 0' }}
            >
              {l.label}
            </a>
          ))}
          <div style={{ height: 1, background: 'var(--ink-3)' }} />
          <a href="/login" onClick={() => setOpen(false)} style={{ fontSize: 16, color: 'var(--ink-5)', padding: '4px 0' }}>
            Log in
          </a>
          <a href="/onboard" onClick={() => setOpen(false)} className="btn-primary btn-full">
            Start Free
          </a>
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
