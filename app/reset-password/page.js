'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import '../globals.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pass1, setPass1] = useState('')
  const [pass2, setPass2] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionErr, setSessionErr] = useState('')

  // Supabase JS SDK auto-detects auth-callback URL (hash/query params)
  // and creates a session on page load. We just verify the session exists.
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await sb().auth.getSession()
      if (!session) {
        // Try once more after a tick in case SDK hasn't processed URL yet
        await new Promise(r => setTimeout(r, 600))
        const { data: { session: s2 } } = await sb().auth.getSession()
        if (!s2) {
          setSessionErr('This reset link is invalid or expired. Request a new one.')
          return
        }
      }
      setSessionReady(true)
    }
    check()
  }, [])

  const submit = async () => {
    setErr('')
    if (pass1.length < 8) { setErr('Password must be at least 8 characters.'); return }
    if (pass1 !== pass2) { setErr('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await sb().auth.updateUser({ password: pass1 })
    setLoading(false)
    if (error) {
      setErr(error.message || 'Could not update password.')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 1800)
  }

  if (sessionErr) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 16 }}>LINK EXPIRED</div>
          <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, color: 'var(--text)', marginBottom: 12 }}>{sessionErr}</h2>
          <a href="/forgot-password" className="btn-gold" style={{ display: 'inline-block', padding: '12px 24px', fontSize: 11, marginTop: 20, textDecoration: 'none' }}>Request a new link</a>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontSize: 48, color: 'var(--gold)', marginBottom: 16 }}>✓</div>
          <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 16 }}>PASSWORD UPDATED</div>
          <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, color: 'var(--text)', marginBottom: 12 }}>You're all set.</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', color: 'var(--muted)', fontSize: 12 }}>Verifying link...</div>
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-gold" style={{ padding: '48px 44px' }}>
          <div className="gold-line-top" />
          <div className="eyebrow" style={{ marginBottom: 24 }}>Reset Password</div>
          <h2 className="cormorant" style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.1, marginBottom: 28, color: 'var(--text)' }}>
            Set a <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>new password.</em>
          </h2>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>New Password</label>
            <input className="input" type="password" placeholder="At least 8 characters"
              value={pass1} onChange={e => setPass1(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="new-password" autoFocus />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Confirm</label>
            <input className="input" type="password" placeholder="Type it again"
              value={pass2} onChange={e => setPass2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} autoComplete="new-password" />
          </div>
          {err && <div style={{ fontSize: 12, color: '#ff7070', marginBottom: 16 }}>{err}</div>}
          <button onClick={submit} disabled={loading} className="btn-gold" style={{ width: '100%', textAlign: 'center', padding: 16, opacity: loading ? .6 : 1 }}>
            {loading ? 'Updating...' : 'Update Password →'}
          </button>
        </div>
      </div>
    </div>
  )
}
