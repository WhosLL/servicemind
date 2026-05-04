'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import '../globals.css'

export default function AdminPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [salons, setSalons] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await sb().auth.getUser()
      if (!user) { router.push('/login'); return }

      // Check admin + load shop list (service-role read on the server)
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/admin/list-shops', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      })
      if (!res.ok) {
        setAuthorized(false)
        setAuthChecked(true)
        return
      }
      setAuthorized(true)
      setAuthChecked(true)
      const data = await res.json()
      setSalons(data.shops || [])
      setLoading(false)
    }
    init()
  }, [])

  if (!authChecked) {
    return <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>Checking...</div>
  }

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div className="cinzel" style={{ fontSize: 12, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 16 }}>FORBIDDEN</div>
          <div className="cormorant" style={{ fontSize: 36, fontWeight: 300, color: 'var(--text)', marginBottom: 12 }}>Not authorized.</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>This area is for ServiceMind operators only.</div>
        </div>
      </div>
    )
  }

  const filtered = salons.filter(s => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (s.shop_name || '').toLowerCase().includes(q)
      || (s.owner_name || '').toLowerCase().includes(q)
      || (s.slug || '').toLowerCase().includes(q)
      || (s.city || '').toLowerCase().includes(q)
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 8 }}>SERVICEMIND ADMIN</div>
            <h1 className="cormorant" style={{ fontSize: 44, fontWeight: 300, color: 'var(--text)', lineHeight: 1.1 }}>
              All shops <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>on the platform.</em>
            </h1>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>{salons.length} total · {salons.filter(s => s.twilio_phone_number).length} with SMS active</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/admin/commissions" className="btn-ghost" style={{ padding: '14px 22px', fontSize: 11 }}>Commissions</a>
            <a href="/admin/new-shop" className="btn-gold" style={{ padding: '14px 28px', fontSize: 11 }}>+ Create Shop</a>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <input className="input" placeholder="Search by name, owner, slug, city..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 420 }} />
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1fr 1.5fr 0.8fr 0.9fr 1.3fr', padding: '14px 18px', background: 'var(--dark-3)', borderBottom: '1px solid var(--border-dim)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <div>Shop</div>
              <div>Owner</div>
              <div>Location</div>
              <div>Twilio Number</div>
              <div>Status</div>
              <div>Created</div>
              <div>Actions</div>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No shops match.</div>
            ) : filtered.map(s => (
              <div key={s.id}
                style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1fr 1.5fr 0.8fr 0.9fr 1.3fr', padding: '16px 18px', borderBottom: '1px solid var(--border-dim)', fontSize: 13, color: 'var(--text)', transition: 'background .15s', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.shop_name || '(unnamed)'}
                    {s.is_pilot && <span style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', letterSpacing: '.15em' }}>PILOT</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.slug}</div>
                </div>
                <div style={{ color: 'var(--text-2)' }}>{s.owner_name || '—'}</div>
                <div style={{ color: 'var(--text-2)' }}>{[s.city, s.state].filter(Boolean).join(', ') || '—'}</div>
                <div style={{ color: s.twilio_phone_number ? 'var(--gold)' : 'var(--muted)', fontFamily: 'monospace', fontSize: 12 }}>
                  {s.twilio_phone_number || 'not provisioned'}
                </div>
                <div>
                  <span style={{ fontSize: 11, padding: '4px 10px', background: s.subscription_status === 'active' ? 'rgba(76,201,76,0.1)' : 'rgba(201,168,76,0.1)', color: s.subscription_status === 'active' ? '#4cc94c' : 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    {s.subscription_status || 'trial'}
                  </span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(s.created_at).toLocaleDateString()}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                  <a href={`/dashboard?as=${s.id}`} style={{ color: 'var(--gold)', textDecoration: 'none', borderBottom: '1px solid var(--gold)' }}>Dashboard</a>
                  <a href={`/book/${s.slug}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-2)', textDecoration: 'none', borderBottom: '1px solid var(--border-dim)' }}>Booking</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
