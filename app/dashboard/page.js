'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import '../globals.css'

const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'clients', label: 'Clients' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'campaigns', label: 'Automations' },
  { id: 'ai', label: 'AI Advisor' },
  { id: 'ghl', label: 'GHL Setup' },
]

export default function Dashboard() {
  const router = useRouter()
  const [salon, setSalon] = useState(null)
  useEffect(() => {
    try {
      const s = localStorage.getItem('sm_salon')
      if (!s) { router.push('/login'); return }
      setSalon(JSON.parse(s))
    } catch { router.push('/login') }
  }, [])

  const [tab, setTab] = useState('overview')
  const [data, setData] = useState({ services: [], appointments: [], reviews: [], clients: [], campaigns: [], ai_conversations: [] })
  const [loading, setLoading] = useState(true)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [ghlKey, setGhlKey] = useState('')

  useEffect(() => { if (salon?.id) load() }, [salon?.id])

  if (!salon) return <div style={{ minHeight: '100vh', background: '#080808' }} />

  const load = async () => {
    if (!salon?.id) return
    const [sv, ap, rv, cl, cp, ai] = await Promise.all([
      sb().from('salon_services').select('*').eq('salon_id', salon.id).order('sort_order'),
      sb().from('appointments').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(100),
      sb().from('salon_reviews').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }),
      sb().from('clients').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(100),
      sb().from('salon_campaigns').select('*').eq('salon_id', salon.id).order('campaign_type'),
      sb().from('ai_conversations').select('*').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(20),
    ])
    setData({ services: sv.data || [], appointments: ap.data || [], reviews: rv.data || [], clients: cl.data || [], campaigns: cp.data || [], ai_conversations: ai.data || [] })
    setLoading(false)
  }

  // Actions
  const deleteReview = async (id) => {
    if (!window.confirm('Remove this review from your page?')) return
    await sb().from('salon_reviews').update({ is_visible: false }).eq('id', id)
    setData(d => ({ ...d, reviews: d.reviews.filter(r => r.id !== id) }))
  }
  const toggleCampaign = async (c) => {
    const upd = { ...c, is_active: !c.is_active }
    await sb().from('salon_campaigns').update({ is_active: upd.is_active }).eq('id', c.id)
    setData(d => ({ ...d, campaigns: d.campaigns.map(x => x.id === c.id ? upd : x) }))
  }
  const updateApptStatus = async (id, status) => {
    await sb().from('appointments').update({ status }).eq('id', id)
    setData(d => ({ ...d, appointments: d.appointments.map(a => a.id === id ? { ...a, status } : a) }))
  }
  const saveGhlKey = async () => {
    if (!ghlKey.trim()) return
    await sb().from('salons').update({ ghl_api_key: ghlKey }).eq('id', salon.id)
    alert('GHL API key saved. Your automations will now sync.')
  }
  const askAi = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true); setAiResponse('')
    const { appointments, reviews, clients, campaigns } = data
    const today = new Date().toISOString().split('T')[0]
    const todayAppts = appointments.filter(a => a.appointment_date === today).length
    const revenue = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + (a.total_price || 0), 0)
    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : 'none'
    const context = `Shop: ${salon.shop_name} | Owner: ${salon.owner_name} | Type: ${salon.salon_type} | City: ${salon.city}, ${salon.state} | Today's appointments: ${todayAppts} | Total clients: ${clients.length} | Completed appointments revenue: $${revenue} | Avg review rating: ${avgRating} | Active campaigns: ${campaigns.filter(c => c.is_active).length}`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are the AI business advisor for ${salon.shop_name}, a ${salon.salon_type} owned by ${salon.owner_name} in ${salon.city}, ${salon.state}. You have access to their business data and your job is to give direct, actionable advice to help them grow. Be specific, concise, and confident. Never hedge. Business context: ${context}`,
          messages: [{ role: 'user', content: aiQuery }]
        })
      })
      const d = await res.json()
      const text = d.content?.map(c => c.text || '').join('') || 'Unable to get a response right now.'
      setAiResponse(text)
      await sb().from('ai_conversations').insert([{ salon_id: salon.id, type: 'advisor', channel: 'web', messages: [{ role: 'user', content: aiQuery }, { role: 'assistant', content: text }], resolved: true }])
    } catch { setAiResponse('AI advisor is temporarily unavailable. Please try again.') }
    setAiLoading(false)
  }

  const { appointments, reviews, clients, campaigns } = data
  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appointments.filter(a => a.appointment_date === today)
  const revenue = appointments.filter(a => a.status === 'completed').reduce((s, a) => s + (a.total_price || 0), 0)
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1) : '—'
  const statusColor = { confirmed: 'var(--gold)', completed: 'var(--green)', cancelled: 'var(--red)', no_show: 'var(--muted)', pending: 'var(--blue)' }

  const Dot = ({ on }) => <div style={{ width: 7, height: 7, borderRadius: '50%', background: on ? 'var(--green)' : 'var(--muted)', flexShrink: 0 }} />
  const Badge = ({ text, color = 'var(--gold)' }) => <span style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color, border: `1px solid ${color}`, padding: '2px 8px', opacity: .9 }}>{text}</span>
  const Empty = ({ main, sub }) => (
    <div style={{ border: '1px dashed var(--border-dim)', padding: '80px 32px', textAlign: 'center' }}>
      <div className="cormorant" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--muted)', marginBottom: 8 }}>{main}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', opacity: .6 }}>{sub}</div>
    </div>
  )
  const Stat = ({ label, value, sub, accent }) => (
    <div style={{ background: 'var(--dark-2)', padding: '26px', border: '1px solid var(--border-dim)', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>{label}</div>
      <div className="cormorant" style={{ fontSize: 44, fontWeight: 300, color: accent || 'var(--gold)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--black)' }}>

      {/* SIDEBAR */}
      <div style={{ width: 240, background: 'var(--dark)', borderRight: '1px solid var(--border-dim)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '28px 24px', borderBottom: '1px solid var(--border-dim)' }}>
          <div className="cinzel" style={{ fontSize: 13, letterSpacing: '.3em', color: 'var(--gold)', marginBottom: 4 }}>ServiceMind</div>
          <div style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Salon Dashboard</div>
        </div>
        <div style={{ padding: '16px 0', flex: 1 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '13px 24px', background: tab === n.id ? 'rgba(201,168,76,.07)' : 'transparent', border: 'none', borderLeft: `2px solid ${tab === n.id ? 'var(--gold)' : 'transparent'}`, color: tab === n.id ? 'var(--gold)' : 'var(--muted)', fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all .15s' }}>
              {n.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-dim)' }}>
          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 3, fontWeight: 400 }}>{salon.shop_name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>{salon.owner_name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Dot on={salon.subscription_status === 'active' || salon.subscription_status === 'trial'} />
            <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase' }}>{salon.subscription_status}</span>
          </div>
          <button onClick={() => { localStorage.removeItem('sm_salon'); router.push('/') }} className="btn-ghost" style={{ padding: '8px 16px', fontSize: 9, width: '100%', textAlign: 'center' }}>Log Out</button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* TOP BAR */}
        <div style={{ padding: '20px 48px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--black)', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div className="cinzel" style={{ fontSize: 14, letterSpacing: '.2em', color: 'var(--text)' }}>{NAV.find(n => n.id === tab)?.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {salon.phone && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{salon.phone}</span>}
            <span className="cinzel" style={{ fontSize: 10, letterSpacing: '.15em', color: 'var(--gold)', border: '1px solid var(--border)', padding: '8px 16px', cursor: 'pointer' }}>
              View My Site →
            </span>
          </div>
        </div>

        <div style={{ padding: '48px' }}>
          {loading && <div className="cinzel" style={{ textAlign: 'center', color: 'var(--muted)', padding: 80, letterSpacing: '.2em', fontSize: 11 }}>Loading...</div>}

          {/* OVERVIEW */}
          {!loading && tab === 'overview' && (
            <div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 44 }}>
                <Stat label="Today's Appointments" value={todayAppts.length} sub={`${appointments.length} total all time`} />
                <Stat label="Total Clients" value={clients.length} sub="in your database" />
                <Stat label="Avg Rating" value={avgRating} sub={`${reviews.length} reviews`} />
                <Stat label="Revenue Tracked" value={`$${revenue.toLocaleString()}`} sub="completed appointments" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 2 }}>
                <div>
                  <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    Today&apos;s Schedule
                    <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                  </div>
                  {todayAppts.length === 0
                    ? <Empty main="No appointments today" sub="Bookings from your site appear here automatically." />
                    : todayAppts.map(a => (
                      <div key={a.id} className="card" style={{ padding: '18px 22px', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{a.client_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.service_name} · {a.appointment_time} · <span style={{ color: 'var(--gold)' }}>${a.total_price}</span></div>
                        </div>
                        <Badge text={a.status} color={statusColor[a.status] || 'var(--muted)'} />
                      </div>
                    ))
                  }
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div className="card" style={{ padding: '28px', flex: 1 }}>
                    <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 16 }}>Automations</div>
                    {campaigns.slice(0, 6).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Dot on={c.is_active} />
                        <span style={{ fontSize: 12, color: c.is_active ? 'var(--text)' : 'var(--muted)' }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card" style={{ padding: '28px' }}>
                    <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 16 }}>Shop Details</div>
                    {[['Type', salon.salon_type], ['City', [salon.city, salon.state].filter(Boolean).join(', ') || '—'], ['Plan', salon.subscription_tier], ['Status', salon.subscription_status]].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
                        <span style={{ color: 'var(--muted)' }}>{l}</span>
                        <span style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS */}
          {!loading && tab === 'appointments' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>{appointments.length} total · {todayAppts.length} today</div>
              {appointments.length === 0 ? <Empty main="No appointments yet" sub="Bookings through your site appear here automatically." /> :
                appointments.map(a => (
                  <div key={a.id} className="card" style={{ padding: '18px 24px', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{a.client_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.service_name} · {a.appointment_date} at {a.appointment_time} · <span style={{ color: 'var(--gold)' }}>${a.total_price}</span></div>
                      {a.client_phone && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{a.client_phone}</div>}
                    </div>
                    <select style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', color: 'var(--text)', padding: '8px 12px', fontSize: 11, outline: 'none', borderRadius: 0, cursor: 'pointer', flexShrink: 0 }}
                      value={a.status} onChange={e => updateApptStatus(a.id, e.target.value)}>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </div>
                ))
              }
            </div>
          )}

          {/* CLIENTS */}
          {!loading && tab === 'clients' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>{clients.length} clients in your database</div>
              {clients.length === 0 ? <Empty main="No clients yet" sub="Every person who books appears here automatically." /> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2 }}>
                  {clients.map(c => (
                    <div key={c.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(201,168,76,.3), var(--dark-3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: 'var(--gold)', fontFamily: 'Cinzel', flexShrink: 0 }}>
                        {(c.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 3 }}>{c.name || 'Unknown'}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.phone || 'No phone'} · {c.total_visits} visits · <span style={{ color: 'var(--gold)' }}>${c.total_spent}</span></div>
                      </div>
                      {c.last_visit_at && <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 }}>{new Date(c.last_visit_at).toLocaleDateString()}</div>}
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* REVIEWS */}
          {!loading && tab === 'reviews' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
                {reviews.length} reviews · {avgRating}★ average · <span style={{ color: 'var(--gold)' }}>You can remove any review</span>
              </div>
              {reviews.length === 0 ? <Empty main="No reviews yet" sub="Reviews submitted on your booking site appear here. You control what stays visible." /> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 2 }}>
                  {reviews.map(r => (
                    <div key={r.id} className="card" style={{ padding: '28px', position: 'relative' }}>
                      <button onClick={() => deleteReview(r.id)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.2)', color: 'var(--red)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', padding: '4px 10px', cursor: 'pointer' }}>
                        Remove
                      </button>
                      <div style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: 3, marginBottom: 12 }}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
                      <div className="cormorant" style={{ fontSize: 16, fontStyle: 'italic', lineHeight: 1.7, color: 'var(--text)', marginBottom: 14 }}>&quot;{r.review_text}&quot;</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.author_name} · {r.service_received} · {new Date(r.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* CAMPAIGNS */}
          {!loading && tab === 'campaigns' && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 32 }}>
                Toggle automations on/off. When active, they run through GHL automatically. Messages use <span style={{ color: 'var(--gold)' }}>{'{{variables}}'}</span> filled per client.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {campaigns.map(c => (
                  <div key={c.id} style={{ background: 'var(--dark)', border: `1px solid ${c.is_active ? 'var(--border)' : 'var(--border-dim)'}`, padding: '22px 28px', transition: 'border-color .2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: c.message_template ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Dot on={c.is_active} />
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{c.campaign_type.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                      <button onClick={() => toggleCampaign(c)} className={c.is_active ? 'btn-ghost' : 'btn-gold'} style={{ padding: '8px 20px', fontSize: 10 }}>
                        {c.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                    {c.message_template && (
                      <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: '12px 16px', fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginLeft: 22, fontStyle: 'italic' }}>
                        &quot;{c.message_template}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI ADVISOR */}
          {!loading && tab === 'ai' && (
            <div>
              <div style={{ background: 'var(--dark)', border: '1px solid var(--border)', padding: '36px', marginBottom: 24, position: 'relative' }}>
                <div className="gold-line-top" />
                <div className="eyebrow" style={{ marginBottom: 20 }}>AI Business Advisor</div>
                <h3 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 16 }}>
                  Ask your <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>AI advisor</em> anything.
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>
                  Your AI knows your shop — its revenue, appointment patterns, client base, and ratings. Ask it for real advice.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', color: 'var(--text)', padding: '14px 18px', fontSize: 13, fontFamily: 'inherit', fontWeight: 300, outline: 'none', borderRadius: 0, flex: 1, transition: 'border-color .2s' }}
                    placeholder="e.g. How can I increase revenue this month?"
                    value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askAi()}
                    onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-dim)'} />
                  <button onClick={askAi} disabled={aiLoading || !aiQuery.trim()} className="btn-gold" style={{ padding: '14px 28px', opacity: aiLoading || !aiQuery.trim() ? .5 : 1 }}>
                    {aiLoading ? '...' : 'Ask →'}
                  </button>
                </div>
                {/* Quick prompts */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {['What should I focus on this week?', 'Why are my no-shows high?', 'How do I get more clients?', 'Write me a slow day promo text'].map(q => (
                    <button key={q} onClick={() => { setAiQuery(q); }} style={{ background: 'transparent', border: '1px solid var(--border-dim)', color: 'var(--muted)', padding: '6px 14px', fontSize: 11, cursor: 'pointer', borderRadius: 0, transition: 'all .15s' }}
                      onMouseOver={e => { e.target.style.borderColor = 'var(--gold-dim)'; e.target.style.color = 'var(--text)' }}
                      onMouseOut={e => { e.target.style.borderColor = 'var(--border-dim)'; e.target.style.color = 'var(--muted)' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              {aiResponse && (
                <div className="card-gold" style={{ padding: '32px' }}>
                  <div className="gold-line-top" />
                  <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 16 }}>AI Advisor Response</div>
                  <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{aiResponse}</div>
                </div>
              )}
            </div>
          )}

          {/* GHL SETUP */}
          {!loading && tab === 'ghl' && (
            <div>
              <div className="card-gold" style={{ padding: '36px', marginBottom: 20 }}>
                <div className="gold-line-top" />
                <div className="cinzel" style={{ fontSize: 11, letterSpacing: '.25em', color: 'var(--gold)', marginBottom: 24 }}>How to Connect GoHighLevel</div>
                {['Log into app.gohighlevel.com', 'Click your profile photo → Settings', 'In the sidebar, find "API Keys"', 'Click "Create New Key" → name it ServiceMind → copy it', 'Paste it below and save'].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <span className="cinzel" style={{ color: 'var(--gold)', fontSize: 13, flexShrink: 0, minWidth: 24 }}>0{i + 1}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', color: 'var(--text)', padding: '15px 18px', fontSize: 13, fontFamily: 'inherit', fontWeight: 300, outline: 'none', borderRadius: 0, flex: 1 }}
                  type="password" placeholder="Paste your GHL API key" value={ghlKey} onChange={e => setGhlKey(e.target.value)} />
                <button onClick={saveGhlKey} className="btn-gold" style={{ padding: '15px 28px', whiteSpace: 'nowrap' }}>Save Key</button>
              </div>
              <div className="card" style={{ padding: '28px' }}>
                <div className="cinzel" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)', marginBottom: 16 }}>What Connects Once You Add Your Key</div>
                {['New clients sync to GHL contacts automatically', 'Appointments create GHL calendar events', 'Missed calls trigger the AI text back workflow', 'Review requests fire after each appointment', 'Win-back campaigns trigger at 45-day mark', 'Birthday offers go out on client birthdays'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                    <span style={{ color: 'var(--gold)', fontSize: 10, marginTop: 3, flexShrink: 0 }}>✦</span>{item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
