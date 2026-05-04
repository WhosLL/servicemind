'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../../lib/supabase'
import '../../globals.css'

export default function NewShopPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [me, setMe] = useState(null)
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    salon_type: 'barbershop',
    city: '',
    state: 'NC',
    address: '',
    zip: '',
    trial_days: 365,
    is_pilot: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await sb().auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: { session } } = await sb().auth.getSession()
      const headers = { 'Authorization': `Bearer ${session?.access_token || ''}` }
      const res = await fetch('/api/admin/check', { headers })
      setAuthorized(res.ok)
      setAuthChecked(true)
      if (res.ok) {
        try {
          const meRes = await fetch('/api/admin/me', { headers })
          if (meRes.ok) setMe(await meRes.json())
        } catch {}
      }
    }
    init()
  }, [])

  const submit = async () => {
    setError('')
    if (!form.shop_name.trim() || !form.owner_name.trim()) {
      setError('Shop name and owner name are required.')
      return
    }
    setSubmitting(true)
    try {
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/admin/create-shop', {
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
          <div className="cinzel" style={{ fontSize: 12, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 16 }}>SHOP CREATED</div>
          <h1 className="cormorant" style={{ fontSize: 44, fontWeight: 300, color: 'var(--text)', marginBottom: 24, lineHeight: 1.1 }}>
            {result.shop_name} <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>is live.</em>
          </h1>
          <div className="card-gold" style={{ padding: 32, textAlign: 'left', marginBottom: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Booking Page</div>
            <div style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--gold)', marginBottom: 16, wordBreak: 'break-all' }}>
              https://servicemind.io/book/{result.slug}
            </div>
            <a href={`https://servicemind.io/book/${result.slug}`} target="_blank" rel="noreferrer" className="btn-gold" style={{ padding: '12px 24px', fontSize: 11, display: 'inline-block', textDecoration: 'none' }}>
              View Booking Page →
            </a>
          </div>
          <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: 24, marginBottom: 24, textAlign: 'left' }}>
            <div className="eyebrow" style={{ marginBottom: 12, color: 'var(--muted)' }}>Next Steps</div>
            <ul style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.9, paddingLeft: 18 }}>
              <li>Open the dashboard for this shop (Admin → "Open dashboard" link)</li>
              <li>Provision a Twilio number, set hours, edit services as needed</li>
              <li>Share the booking page link with the shop owner</li>
              <li>For owner login: create an auth user in Supabase Auth dashboard with the same email and share creds out-of-band (polished claim flow ships in a follow-up)</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="/admin" className="btn-ghost" style={{ padding: '12px 24px', fontSize: 11 }}>← Back to Admin</a>
            <a href={`/dashboard?as=${result.id}`} className="btn-ghost" style={{ padding: '12px 24px', fontSize: 11 }}>Open Dashboard →</a>
            <a href="/admin/new-shop" className="btn-gold" style={{ padding: '12px 24px', fontSize: 11 }}>Create Another</a>
          </div>
        </div>
      </div>
    )
  }

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '60px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <a href="/admin" className="btn-ghost" style={{ fontSize: 10, marginBottom: 24, display: 'inline-block' }}>← Back to Admin</a>
        <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 8 }}>NEW SHOP</div>
        <h1 className="cormorant" style={{ fontSize: 40, fontWeight: 300, color: 'var(--text)', marginBottom: 8, lineHeight: 1.1 }}>
          Create a shop <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>on behalf of someone.</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8, marginBottom: 32 }}>
          Use this for pilot shops, partners, or any shop you're onboarding manually. Skips the Stripe gating. The shop is created with a comp/extended trial. Default services + automations are pre-loaded; the owner can claim dashboard access later.
        </p>

        <div className="card-gold" style={{ padding: 32 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Shop info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Shop Name *</label>
              <input className="input" value={form.shop_name} onChange={e => setField('shop_name', e.target.value)} placeholder="Mike's Cuts" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Salon Type</label>
              <select className="input" value={form.salon_type} onChange={e => setField('salon_type', e.target.value)}>
                <option value="barbershop">Barbershop</option>
                <option value="hair">Hair Salon</option>
                <option value="nail">Nail Salon</option>
                <option value="lash">Lash Studio</option>
                <option value="spa">Spa</option>
                <option value="tattoo">Tattoo</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 16, marginTop: 8 }}>Owner info</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Owner Name *</label>
              <input className="input" value={form.owner_name} onChange={e => setField('owner_name', e.target.value)} placeholder="Mike Johnson" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Owner Phone</label>
              <input className="input" value={form.owner_phone} onChange={e => setField('owner_phone', e.target.value)} placeholder="(555) 000-0000" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Owner Email</label>
            <input className="input" value={form.owner_email} onChange={e => setField('owner_email', e.target.value)} placeholder="mike@example.com" />
          </div>

          <div className="eyebrow" style={{ marginBottom: 16, marginTop: 8 }}>Location</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>City</label>
              <input className="input" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Raleigh" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>State</label>
              <input className="input" value={form.state} onChange={e => setField('state', e.target.value.toUpperCase())} maxLength={2} placeholder="NC" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Zip</label>
              <input className="input" value={form.zip} onChange={e => setField('zip', e.target.value)} placeholder="27615" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Address (optional)</label>
            <input className="input" value={form.address} onChange={e => setField('address', e.target.value)} placeholder="123 Main St" />
          </div>

          <div className="eyebrow" style={{ marginBottom: 16, marginTop: 8 }}>Comp Settings</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Trial Length (days)</label>
            <input className="input" type="number" value={form.trial_days} onChange={e => setField('trial_days', Number(e.target.value))} style={{ maxWidth: 160 }} />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Default 365 for pilot shops. Sets `trial_ends_at` to today + this many days.</div>
          </div>
          <div style={{ marginBottom: 16, padding: 14, background: 'var(--dark-3)', border: '1px solid var(--border-dim)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!form.is_pilot} onChange={e => setField('is_pilot', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <span style={{ color: 'var(--text)', fontSize: 13 }}>Mark as pilot (permanently exempt from Stripe billing)</span>
            </label>
          </div>
          <div style={{ marginBottom: 24, padding: 14, background: 'rgba(201,168,76,0.04)', border: '1px solid var(--border-dim)', fontSize: 12, color: 'var(--text-2)' }}>
            <div className="eyebrow" style={{ marginBottom: 6, fontSize: 9, color: 'var(--gold)' }}>Audit trail (stamped on this shop)</div>
            <div>Created by: <strong style={{ color: 'var(--text)' }}>{me?.display_name || me?.email || '—'}</strong></div>
            <div>Commission rate: <strong style={{ color: 'var(--text)' }}>{((me?.default_commission_rate ?? 0) * 100).toFixed(1)}%</strong></div>
          </div>

          {error && <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.4)', padding: 12, marginBottom: 16, color: '#ff7070', fontSize: 13 }}>{error}</div>}

          <button onClick={submit} disabled={submitting || !form.shop_name.trim() || !form.owner_name.trim()}
            className="btn-gold" style={{ padding: '14px 32px', fontSize: 11, opacity: submitting ? .5 : 1 }}>
            {submitting ? 'Creating...' : 'Create Shop →'}
          </button>
        </div>
      </div>
    </div>
  )
}
