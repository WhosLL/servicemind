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

  const handleOAuth = async (provider) => {
    setLoading(true); setErr('')
    const { error } = await sb().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) { setErr(error.message); setLoading(false) }
  }

  const go = async () => {
    const email = emailRef.current?.value?.trim()
    const password = passRef.current?.value?.trim()
    if (!email || !password) { setErr('Enter your email and password.'); return }
    setLoading(true); setErr('')
    const { data: signInData, error } = await sb().auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message || ''
      if (/email not confirmed/i.test(msg)) setErr('Check your email and click the verification link before signing in.')
      else if (/invalid|incorrect/i.test(msg)) setErr('Email or password is incorrect.')
      else if (/rate|too many/i.test(msg)) setErr('Too many attempts. Wait a minute and try again.')
      else setErr(msg || 'Could not sign in. Try again.')
      setLoading(false)
    } else {
      // Role-based routing: admins → /admin, reps → /rep, shop owners → /dashboard
      try {
        const { data: profile } = await sb()
          .from('profiles')
          .select('role')
          .eq('id', signInData?.user?.id)
          .maybeSingle()
        if (profile?.role === 'admin') router.push('/admin')
        else if (profile?.role === 'rep') router.push('/rep')
        else router.push('/dashboard')
      } catch {
        router.push('/dashboard')
      }
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
          {err && <div style={{ fontSize: 12, color: '#ff7070', marginBottom: 16 }}>{err}</div>}
          <button onClick={go} disabled={loading} className="btn-gold" style={{ width: '100%', textAlign: 'center', padding: '16px', opacity: loading ? .6 : 1 }}>
            {loading ? 'Logging in...' : 'Enter Dashboard →'}
          </button>
          {/* OAuth divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.2em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
          </div>
          {/* Google */}
          <button onClick={() => handleOAuth('google')} disabled={loading} className="btn-ghost"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px', marginBottom: 10, opacity: loading ? .6 : 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span style={{ fontSize: 11, letterSpacing: '.1em' }}>Continue with Google</span>
          </button>
          {/* Apple */}
          <button onClick={() => handleOAuth('apple')} disabled={loading} className="btn-ghost"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px', opacity: loading ? .6 : 1 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text)' }}>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.23.73 2.99.75 1.14-.22 2.23-.9 3.43-.77 1.46.17 2.56.75 3.28 1.88-3 1.8-2.25 5.78.57 6.89-.6 1.56-1.39 3.1-2.27 4.13zm-5.02-15.03c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span style={{ fontSize: 11, letterSpacing: '.1em' }}>Continue with Apple</span>
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, fontSize: 11 }}>
            <a href="/forgot-password" style={{ color: 'var(--muted)', textDecoration: 'none', borderBottom: '1px solid var(--border-dim)', paddingBottom: 1 }}>Forgot password?</a>
            <a href="/onboard" style={{ color: 'var(--gold)', textDecoration: 'none' }}>New shop? Sign up →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
