'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import '../globals.css'

const formatDollars = (cents) => `$${(cents / 100).toFixed(2)}`

export default function RepDashboard() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await sb().auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/rep/me-stats', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      })
      if (!res.ok) {
        setAuthorized(false)
        setAuthChecked(true)
        return
      }
      setAuthorized(true)
      setAuthChecked(true)
      const json = await res.json()
      setData(json)
      setLoading(false)
    }
    init()
  }, [])

  if (!authChecked) return <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>Checking...</div>
  if (!authorized) return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="cormorant" style={{ fontSize: 32, color: 'var(--text)' }}>Not authorized. This portal is for sales reps and admins only.</div>
    </div>
  )

  const profile = data?.profile || {}
  const shops = data?.shops || []
  const totals = data?.totals || { paid_cents: 0, owed_cents: 0, pending_cents: 0 }
  const planLabel = profile.compensation_plan === 'residual_only'
    ? 'Lifetime Residual'
    : profile.compensation_plan === 'salary_plus_commission'
    ? 'Salary + Commission'
    : 'Admin'
  const ratePct = ((profile.default_commission_rate ?? 0) * 100).toFixed(1)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      {/* Top bar */}
      <div style={{ padding: '20px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--black)', zIndex: 10 }}>
        <div>
          <div className="cinzel" style={{ fontSize: 12, letterSpacing: '.3em', color: 'var(--gold)' }}>SERVICEMIND REP PORTAL</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{profile.display_name || profile.email}</span>
          <button onClick={() => sb().auth.signOut().then(() => router.push('/login'))} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 10 }}>Log Out</button>
        </div>
      </div>

      <div style={{ padding: '48px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <h1 className="cormorant" style={{ fontSize: 48, fontWeight: 300, color: 'var(--text)', lineHeight: 1.1, marginBottom: 8 }}>
            Welcome back{profile.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>.</em>
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
            {planLabel} · {ratePct}% of base subscription on every shop you sign · vested for life
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          <div style={{ padding: 24, background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--muted)' }}>Shops Signed</div>
            <div className="cormorant" style={{ fontSize: 36, color: 'var(--text)' }}>{shops.length}</div>
          </div>
          <div style={{ padding: 24, background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--muted)' }}>Pending</div>
            <div className="cormorant" style={{ fontSize: 36, color: 'var(--text-2)' }}>{formatDollars(totals.pending_cents)}</div>
          </div>
          <div style={{ padding: 24, background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--muted)' }}>Owed</div>
            <div className="cormorant" style={{ fontSize: 36, color: 'var(--gold)' }}>{formatDollars(totals.owed_cents)}</div>
          </div>
          <div style={{ padding: 24, background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--muted)' }}>Paid (lifetime)</div>
            <div className="cormorant" style={{ fontSize: 36, color: '#4cc94c' }}>{formatDollars(totals.paid_cents)}</div>
          </div>
        </div>

        {/* Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 className="cormorant" style={{ fontSize: 28, fontWeight: 300, color: 'var(--text)' }}>Your book of business</h2>
          <a href="/rep/new-shop" className="btn-gold" style={{ padding: '14px 28px', fontSize: 11 }}>+ Sign Up New Shop</a>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
        ) : shops.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="cormorant" style={{ fontSize: 28, color: 'var(--text-2)', marginBottom: 12 }}>No shops yet.</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Every shop you sign up earns you {ratePct}% lifetime. Time to get to work.</div>
            <a href="/rep/new-shop" className="btn-gold" style={{ padding: '12px 24px', fontSize: 11 }}>+ Sign Your First Shop</a>
          </div>
        ) : (
          <div style={{ background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1fr 1.3fr 0.9fr 1fr', padding: '14px 18px', background: 'var(--dark-3)', borderBottom: '1px solid var(--border-dim)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <div>Shop</div>
              <div>Owner</div>
              <div>Rate</div>
              <div>SMS Number</div>
              <div>Status</div>
              <div>Signed</div>
            </div>
            {shops.map(s => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1fr 1.3fr 0.9fr 1fr', padding: '16px 18px', borderBottom: '1px solid var(--border-dim)', fontSize: 13, color: 'var(--text)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.shop_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    <a href={`/book/${s.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>servicemind.io/book/{s.slug} ↗</a>
                  </div>
                </div>
                <div style={{ color: 'var(--text-2)' }}>{s.owner_name || '—'}</div>
                <div style={{ color: 'var(--gold)' }}>{(Number(s.commission_rate) * 100).toFixed(1)}%</div>
                <div style={{ color: s.twilio_phone_number ? 'var(--gold)' : 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>
                  {s.twilio_phone_number || 'not provisioned'}
                </div>
                <div>
                  <span style={{ fontSize: 11, padding: '4px 10px', background: s.subscription_status === 'active' ? 'rgba(76,201,76,0.1)' : 'rgba(201,168,76,0.1)', color: s.subscription_status === 'active' ? '#4cc94c' : 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    {s.subscription_status || 'trial'}
                  </span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(s.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
