'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../../lib/supabase'
import '../../globals.css'

const formatDollars = (cents) => `$${(cents / 100).toFixed(2)}`

export default function CommissionsPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState({ paid_cents: 0, owed_cents: 0, pending_cents: 0 })
  const [reps, setReps] = useState([])
  const [filterRep, setFilterRep] = useState('all')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await sb().auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: { session } } = await sb().auth.getSession()
      const res = await fetch('/api/admin/list-commissions', {
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
      setRows(data.rows || [])
      setTotals(data.totals || { paid_cents: 0, owed_cents: 0, pending_cents: 0 })
      setReps(data.reps || [])
      setLoading(false)
    }
    init()
  }, [])

  if (!authChecked) {
    return <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>Checking...</div>
  }

  if (!authorized) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="cormorant" style={{ fontSize: 32, color: 'var(--text)' }}>Not authorized.</div>
      </div>
    )
  }

  const filtered = filterRep === 'all'
    ? rows
    : rows.filter(r => r.rep_user_id === filterRep)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <a href="/admin" className="btn-ghost" style={{ fontSize: 10, marginBottom: 24, display: 'inline-block' }}>← Back to Admin</a>
        <div style={{ marginBottom: 32 }}>
          <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 8 }}>SERVICEMIND COMMISSIONS</div>
          <h1 className="cormorant" style={{ fontSize: 44, fontWeight: 300, color: 'var(--text)', lineHeight: 1.1 }}>
            Rep ledger <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>(money in → commission out).</em>
          </h1>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>
            Populated by Stripe webhook on every successful customer payment. Empty until M2 ships.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <div style={{ padding: 24, background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--muted)' }}>Paid</div>
            <div className="cormorant" style={{ fontSize: 32, color: 'var(--text)' }}>{formatDollars(totals.paid_cents)}</div>
          </div>
          <div style={{ padding: 24, background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--muted)' }}>Owed</div>
            <div className="cormorant" style={{ fontSize: 32, color: 'var(--gold)' }}>{formatDollars(totals.owed_cents)}</div>
          </div>
          <div style={{ padding: 24, background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--muted)' }}>Pending</div>
            <div className="cormorant" style={{ fontSize: 32, color: 'var(--text-2)' }}>{formatDollars(totals.pending_cents)}</div>
          </div>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Filter by rep:</label>
          <select className="input" value={filterRep} onChange={e => setFilterRep(e.target.value)} style={{ maxWidth: 280 }}>
            <option value="all">All ({rows.length})</option>
            {reps.map(r => (
              <option key={r.id} value={r.id}>
                {r.display_name || '(unnamed)'} — {r.role}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ background: 'var(--dark)', border: '1px solid var(--border-dim)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr 1fr 0.9fr 1fr', padding: '14px 18px', background: 'var(--dark-3)', borderBottom: '1px solid var(--border-dim)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <div>Rep</div>
              <div>Shop</div>
              <div>Gross</div>
              <div>Rate</div>
              <div>Commission</div>
              <div>Status</div>
              <div>Earned</div>
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No commissions yet. Stripe webhook in M2 will write rows here on each successful customer payment.
              </div>
            ) : filtered.map(r => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr 1fr 0.9fr 1fr', padding: '16px 18px', borderBottom: '1px solid var(--border-dim)', fontSize: 13, color: 'var(--text)' }}>
                <div>{r.profiles?.display_name || r.rep_user_id?.slice(0, 8) || '—'}</div>
                <div>{r.salons?.shop_name || '—'}</div>
                <div style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>{formatDollars(r.gross_amount_cents)}</div>
                <div style={{ color: 'var(--text-2)' }}>{(Number(r.commission_rate) * 100).toFixed(1)}%</div>
                <div style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{formatDollars(r.commission_amount_cents)}</div>
                <div>
                  <span style={{ fontSize: 10, padding: '3px 8px', background: r.status === 'paid' ? 'rgba(76,201,76,0.1)' : r.status === 'clawed_back' ? 'rgba(255,80,80,0.1)' : 'rgba(201,168,76,0.1)', color: r.status === 'paid' ? '#4cc94c' : r.status === 'clawed_back' ? '#ff7070' : 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    {r.status}
                  </span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(r.earned_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
