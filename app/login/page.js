'use client'
import { useState } from 'react'
import { sb } from '../../lib/supabase'
import '../globals.css'

export default function Login({ onBack, onLogin }) {
  const [form, setForm] = useState({ shop_name: '', passcode: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const go = async () => {
    if (!form.shop_name || !form.passcode) { setErr('Enter your shop name and passcode.'); return }
    setLoading(true); setErr('')
    const { data, error } = await sb().from('salons').select('*').ilike('shop_name', form.shop_name).eq('passcode', form.passcode)
    if (error || !data || data.length === 0) setErr('Shop name or passcode is incorrect.')
    else onLogin(data[0])
    setLoading(false)
  }

  const inp = { background: 'var(--dark-3)', border: '1px solid var(--border-dim)', color: 'var(--text)', padding: '15px 18px', fontSize: 14, outline: 'none', width: '100%', fontFamily: 'inherit', fontWeight: 300, borderRadius: 0, transition: 'border-color .2s' }

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
            <input style={inp} placeholder="e.g. Boo Cutz" value={form.shop_name}
              onChange={e => setForm({ ...form, shop_name: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && go()}
              onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-dim)'} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Passcode</label>
            <input style={inp} type="password" placeholder="Your passcode" value={form.passcode}
              onChange={e => setForm({ ...form, passcode: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && go()}
              onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-dim)'} />
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
