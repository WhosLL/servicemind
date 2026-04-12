'use client'
import { useState, useRef } from 'react'
import { sb } from '../../lib/supabase'
import '../globals.css'

export default function Login({ onBack, onLogin }) {
  const shopRef = useRef(null)
  const passRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const go = async () => {
    const shopName = shopRef.current?.value?.trim()
    const passcode = passRef.current?.value?.trim()
    if (!shopName || !passcode) { setErr('Enter your shop name and passcode.'); return }
    setLoading(true); setErr('')
    const { data, error } = await sb().from('salons').select('*').ilike('shop_name', shopName).eq('passcode', passcode)
    if (error || !data || data.length === 0) setErr('Shop name or passcode is incorrect.')
    else onLogin(data[0])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button onClick={onBack} className="btn-ghost" style={{ marginBottom: 36, fontSize: 10 }}>← Back to Home</button>
        <div className="card-gold" style={{ padding: '48px 44px' }}>
          <div className="gold-line-top" />
          <div className="eyebrow" style={{ marginBottom: 24 }}>Barber Portal</div>
          <h2 className="cormorant" style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.1, marginBottom: 36 }}>
            Welcome <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>back.</em>
          </h2>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Shop Name</label>
            <input
              ref={shopRef}
              className="input"
              placeholder="e.g. Boo Cutz"
              defaultValue=""
              onKeyDown={e => e.key === 'Enter' && go()}
              autoComplete="off"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Passcode</label>
            <input
              ref={passRef}
              className="input"
              type="password"
              placeholder="Your passcode"
              defaultValue=""
              onKeyDown={e => e.key === 'Enter' && go()}
            />
          </div>
          {err && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 16 }}>{err}</div>}
          <button onClick={go} disabled={loading} className="btn-gold"
            style={{ width: '100%', textAlign: 'center', padding: '16px', opacity: loading ? .6 : 1 }}>
            {loading ? 'Logging in...' : 'Enter Dashboard →'}
          </button>
        </div>
      </div>
    </div>
  )
}
