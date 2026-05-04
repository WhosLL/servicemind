'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../../lib/supabase'
import '../../globals.css'

const generatePassword = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let p = ''
  for (let i = 0; i < 14; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

export default function NewRepPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [form, setForm] = useState({
    email: '',
    display_name: '',
    password: generatePassword(),
    compensation_plan: 'residual_only',
    default_commission_rate: 0.50,
    base_salary_monthly_cents: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await sb().auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/admin/check', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      })
      setAuthorized(res.ok)
      setAuthChecked(true)
    }
    init()
  }, [])

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const submit = async () => {
    setError('')
    if (!form.email.trim() || !form.display_name.trim() || !form.password) {
      setError('Email, name, and password are required.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setSubmitting(true)
    try {
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/admin/create-rep', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Create failed')
        setSubmitting(false)
        return
      }
      setResult(data)
    } catch (e) {
      setError(e.message || 'Network error')
    }
    setSubmitting(false)
  }

  if (!authChecked) return <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>Checking...</div>
  if (!authorized) return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="cormorant" style={{ fontSize: 32, color: 'var(--text)' }}>Not authorized.</div>
    </div>
  )

  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '60px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div className="cinzel" style={{ fontSize: 12, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 16 }}>REP CREATED</div>
          <h1 className="cormorant" style={{ fontSize: 44, fontWeight: 300, color: 'var(--text)', marginBottom: 24, lineHeight: 1.1 }}>
            {result.display_name} <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>is on the team.</em>
          </h1>
          <div className="card-gold" style={{ padding: 32, textAlign: 'left', marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Login Credentials — Share with Rep</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Email</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--text)' }}>{result.email}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Password</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--gold)' }}>{result.generated_password}</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Login URL</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)' }}>servicemind.io/login</div>
            </div>
            <div style={{ marginTop: 18, padding: 12, background: 'rgba(201,168,76,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
              <strong>Comp plan:</strong> {result.compensation_plan === 'residual_only' ? '50% lifetime residual' : 'Salary + commission'}<br/>
              <strong>Commission rate:</strong> {(result.default_commission_rate * 100).toFixed(1)}%
              {result.base_salary_monthly_cents !== null && (
                <><br/><strong>Base salary:</strong> ${(result.base_salary_monthly_cents / 100).toFixed(2)}/mo</>
              )}
            </div>
          </div>
          <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: 24, marginBottom: 24, textAlign: 'left', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>Important:</strong> This password won't be shown again. Copy it now and send to the rep via your preferred channel (Signal, text, etc). They sign in at servicemind.io/login and land on /rep automatically.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="/admin" className="btn-ghost" style={{ padding: '12px 24px', fontSize: 11 }}>← Back to Admin</a>
            <a href="/admin/new-rep" className="btn-gold" style={{ padding: '12px 24px', fontSize: 11 }}>+ Add Another Rep</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '60px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <a href="/admin" className="btn-ghost" style={{ fontSize: 10, marginBottom: 24, display: 'inline-block' }}>← Back to Admin</a>
        <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 8 }}>NEW REP</div>
        <h1 className="cormorant" style={{ fontSize: 40, fontWeight: 300, color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>
          Add a sales rep <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>to your team.</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>
          Creates a login. Rep signs in at /login → lands on /rep. Every shop they sign up gets stamped with their commission rate, locked at this moment for life. Future rate changes won't touch their existing book.
        </p>

        <div className="card-gold" style={{ padding: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Account</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Display Name *</label>
            <input className="input" value={form.display_name} onChange={e => setField('display_name', e.target.value)} placeholder="Marcus Johnson" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Email *</label>
            <input className="input" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="marcus@example.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Password *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={form.password} onChange={e => setField('password', e.target.value)} style={{ fontFamily: 'monospace', flex: 1 }} />
              <button onClick={() => setField('password', generatePassword())} className="btn-ghost" style={{ padding: '8px 14px', fontSize: 10, whiteSpace: 'nowrap' }}>↻ Generate</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Auto-generated. You'll see this once on the next screen — copy + share with the rep.</div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 16, marginTop: 8 }}>Compensation</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Plan *</label>
            <select className="input" value={form.compensation_plan} onChange={e => setField('compensation_plan', e.target.value)}>
              <option value="residual_only">Plan A — 50% lifetime residual (no salary)</option>
              <option value="salary_plus_commission">Plan B — Salary + lower commission</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: form.compensation_plan === 'salary_plus_commission' ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Commission Rate</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="input" type="number" step="0.01" min="0" max="1" value={form.default_commission_rate} onChange={e => setField('default_commission_rate', Number(e.target.value))} style={{ width: 110 }} />
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>= {(form.default_commission_rate * 100).toFixed(1)}% of base subscription</span>
              </div>
            </div>
            {form.compensation_plan === 'salary_plus_commission' && (
              <div>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Base Salary ($/month)</label>
                <input className="input" type="number" min="0" value={form.base_salary_monthly_cents / 100} onChange={e => setField('base_salary_monthly_cents', Math.round(Number(e.target.value) * 100))} placeholder="3000" />
              </div>
            )}
          </div>

          {error && <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.4)', padding: 12, marginBottom: 16, color: '#ff7070', fontSize: 13 }}>{error}</div>}

          <button onClick={submit} disabled={submitting || !form.email.trim() || !form.display_name.trim() || !form.password}
            className="btn-gold" style={{ padding: '14px 32px', fontSize: 11, opacity: submitting ? .5 : 1 }}>
            {submitting ? 'Creating rep...' : 'Create Rep →'}
          </button>
        </div>
      </div>
    </div>
  )
}
