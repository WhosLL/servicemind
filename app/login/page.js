'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import '../globals.css'

export default function LoginPage() {
  const router = useRouter()
  const emailRef = useRef(null)
  const passRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const go = async () => {
    const email = emailRef.current?.value?.trim()
    const password = passRef.current?.value?.trim()
    if (!email || !password) { setErr('Enter your email and password.'); return }
    setLoading(true); setErr('')
    const { error } = await sb().auth.signInWithPassword({ email, password })
    if (error) {
      setErr('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button onClick={() => router.push('/')} className="btn-ghost" style={{ marginBottom: 36, fontSize: 10 }}>← Back to Home</button>
        <div className="card-gold" style={{ padding: '48px 44px' }}>
          <div className="gold-line-top" />
          <div className="eyebrow" style={{ marginBottom: 24 }}>Barber Portal</div>
          <h2 className="cormorant" style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.1, marginBottom: 36 }}>
            Welcome <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>back.</em>
          </h2>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Email</label>
            <input ref={emailRef} className="input" type="email" placeholder="you@shop.com" defaultValue="" onKeyDown={e => e.key === 'Enter' && go()} autoComplete="email" autoFocus />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Password</label>
            <input ref={passRef} className="input" type="password" placeholder="Your password" defaultValue="" onKeyDown={e => e.key === 'Enter' && go()} autoComplete="current-password" />
          </div>
          {err && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>{err}</div>}
          <button onClick={go} disabled={loading} className="btn-gold" style={{ width: '100%', textAlign: 'center', padding: '16px', opacity: loading ? .6 : 1 }}>
            {loading ? 'Logging in...' : 'Enter Dashboard →'}
          </button>
        </div>
      </div>
    </div>
  )
}
