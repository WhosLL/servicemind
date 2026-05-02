'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import '../globals.css'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!email.trim()) { setErr('Enter the email you signed up with.'); return }
    setLoading(true); setErr('')
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://servicemind.io'
    const { error } = await sb().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setErr(error.message || 'Could not send reset email. Try again.')
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 16 }}>RESET LINK SENT</div>
          <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, lineHeight: 1.15, marginBottom: 16, color: 'var(--text)' }}>
            Check your <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>email.</em>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
            If <strong style={{ color: 'var(--text-2)' }}>{email}</strong> is registered, you'll receive a link to reset your password within a minute. Check spam if you don't see it. The link expires in 1 hour.
          </p>
          <button onClick={() => router.push('/login')} className="btn-ghost" style={{ padding: '12px 24px', fontSize: 11 }}>
            ← Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button onClick={() => router.push('/login')} className="btn-ghost" style={{ marginBottom: 36, fontSize: 10 }}>← Back to Login</button>
        <div className="card-gold" style={{ padding: '48px 44px' }}>
          <div className="gold-line-top" />
          <div className="eyebrow" style={{ marginBottom: 24 }}>Forgot Password</div>
          <h2 className="cormorant" style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.1, marginBottom: 16, color: 'var(--text)' }}>
            Reset your <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>password.</em>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 28 }}>
            Enter your account email. We'll send you a secure link to set a new password.
          </p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Email</label>
            <input className="input" type="email" placeholder="you@shop.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="email" autoFocus />
          </div>
          {err && <div style={{ fontSize: 12, color: '#ff7070', marginBottom: 16 }}>{err}</div>}
          <button onClick={submit} disabled={loading} className="btn-gold" style={{ width: '100%', textAlign: 'center', padding: 16, opacity: loading ? .6 : 1 }}>
            {loading ? 'Sending...' : 'Send Reset Link →'}
          </button>
        </div>
      </div>
    </div>
  )
}
