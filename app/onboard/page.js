'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb, DEFAULT_SERVICES } from '../../lib/supabase'
import '../globals.css'

const CAMPAIGNS = (id) => [
  { salon_id: id, campaign_type: 'missed_call', name: 'Missed Call Text Back', is_active: true, message_template: "Hey! You just missed us at {{shop_name}}. Ready to book? Reply here or tap: {{booking_link}}" },
  { salon_id: id, campaign_type: 'reminder_24h', name: 'Appointment Reminder (24hr)', is_active: true, message_template: "Reminder: You have an appointment at {{shop_name}} tomorrow at {{time}}. Reply CANCEL to reschedule." },
  { salon_id: id, campaign_type: 'reminder_1h', name: 'Appointment Reminder (1hr)', is_active: true, message_template: "See you soon! Your appointment at {{shop_name}} starts in 1 hour at {{time}}." },
  { salon_id: id, campaign_type: 'review_request', name: 'Post-Appointment Review', is_active: true, message_template: "Thanks for coming in! Mind leaving us a quick review? {{review_link}}" },
  { salon_id: id, campaign_type: 'win_back', name: 'Win-Back (45 Days)', is_active: true, message_template: "We miss you! Come back this week and save 10%: {{booking_link}}" },
  { salon_id: id, campaign_type: 'birthday', name: 'Birthday Special', is_active: true, message_template: "Happy Birthday! $5 off your next visit this month: {{booking_link}}" },
  { salon_id: id, campaign_type: 'slow_day', name: 'Slow Day Blast', is_active: false, message_template: "Spots just opened today at {{shop_name}}! Book now: {{booking_link}}" },
  { salon_id: id, campaign_type: 'no_show', name: 'No-Show Follow-up', is_active: true, message_template: "You missed your appointment — no worries! Rebook anytime: {{booking_link}}" },
]

const OPENS = ['6:00 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '10:00 AM']
const CLOSES = ['3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM']
const TYPES = ['barbershop', 'nail', 'lash', 'hair', 'spa', 'tattoo', 'other']
const DAYS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }

// Defined OUTSIDE main component — React never remounts these on re-render
function Progress({ step, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 44 }}>
      <button onClick={onBack} className="btn-ghost" style={{ fontSize: 10, padding: '9px 18px' }}>← Back</button>
      <div style={{ display: 'flex', gap: 5, flex: 1 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 2, flex: i <= step ? 1 : '.4', background: i <= step ? 'var(--gold)' : 'var(--border-dim)', transition: 'all .3s' }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.2em', textTransform: 'uppercase', flexShrink: 0 }}>
        {Math.min(step, 4)} / 4
      </span>
    </div>
  )
}

function Wrap({ step, onBack, title, italic, sub, children, onNext, nextLabel = 'Continue →', canNext = true, loading, err }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--black)' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        <Progress step={step} onBack={onBack} />
        <div className="card-gold" style={{ padding: '48px 48px' }}>
          <div className="gold-line-top" />
          <div className="eyebrow" style={{ marginBottom: 20 }}>Setup — Step {Math.min(step, 4)} of 4</div>
          <h2 className="cormorant" style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.1, marginBottom: 8 }}>
            {title} <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{italic}</em>
          </h2>
          {sub && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.8 }}>{sub}</p>}
          <div style={{ marginTop: 32 }}>{children}</div>
          {err && <div style={{ fontSize: 12, color: 'var(--red)', margin: '16px 0' }}>{err}</div>}
          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onNext} disabled={!canNext || loading} className="btn-gold"
              style={{ padding: '16px 40px', opacity: canNext && !loading ? 1 : .45 }}>
              {loading ? 'Launching...' : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Onboard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState({ shop_name: '', owner_name: '', phone: '', email: '', instagram: '', city: '', state: '', address: '', salon_type: 'barbershop', passcode: '' })
  const [svcs, setSvcs] = useState(DEFAULT_SERVICES)
  const [hours, setHours] = useState({ mon: { open: '8:00 AM', close: '6:00 PM' }, tue: { open: '8:00 AM', close: '6:00 PM' }, wed: { open: '8:00 AM', close: '6:00 PM' }, thu: { open: '8:00 AM', close: '6:00 PM' }, fri: null, sat: null, sun: null })

  const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const goBack = () => step === 1 ? router.push('/') : (setStep(s => s - 1), setErr(''))
  const set = (key, val) => setInfo(prev => ({ ...prev, [key]: val }))

  const submit = async () => {
    setLoading(true); setErr('')
    try {
      const slug = slugify(info.shop_name) + '-' + Math.random().toString(36).slice(2, 6)
      const { data: sd, error: se } = await sb().from('salons').insert([{ ...info, hours, slug, subscription_status: 'trial', subscription_tier: 'basic', monthly_rate: 150, onboarded: true, onboarded_at: new Date().toISOString() }]).select()
      if (se) throw se
      const salon = sd[0]
      await sb().from('salon_services').insert(svcs.map(s => ({ ...s, salon_id: salon.id })))
      await sb().from('salon_campaigns').insert(CAMPAIGNS(salon.id))
      localStorage.setItem('sm_salon', JSON.stringify(salon))
      setStep(5)
      setTimeout(() => router.push('/dashboard'), 2200)
    } catch (e) { setErr('Setup failed: ' + (e.message || 'Please try again.')); setLoading(false) }
  }

  const wp = { step, onBack: goBack, loading, err }

  if (step === 1) return (
    <Wrap {...wp} title="Your Shop" italic="Info." sub="This powers your website, booking page, and AI automatically."
      onNext={() => { if (!info.shop_name || !info.owner_name || !info.phone) { setErr('Shop name, owner name, and phone are required.'); return } setErr(''); setStep(2) }}
      canNext={!!info.shop_name}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[['Shop Name *', 'shop_name', 'e.g. Boo Cutz'], ['Owner Name *', 'owner_name', 'e.g. Brandon McCoy'], ['Phone *', 'phone', '(404) 000-0000'], ['Email', 'email', 'you@shop.com'], ['Instagram', 'instagram', '@yourshop']].map(([label, key, ph]) => (
          <div key={key}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>{label}</label>
            <input className="input" placeholder={ph} value={info[key]} onChange={e => set(key, e.target.value)} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Salon Type</label>
          <select className="input" value={info.salon_type} onChange={e => set('salon_type', e.target.value)}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        {[['City', 'city', 'Raleigh'], ['State', 'state', 'NC']].map(([label, key, ph]) => (
          <div key={key}>
            <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>{label}</label>
            <input className="input" placeholder={ph} value={info[key]} onChange={e => set(key, e.target.value)} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Address (optional)</label>
        <input className="input" placeholder="123 Main Street" value={info.address} onChange={e => set('address', e.target.value)} />
      </div>
    </Wrap>
  )

  if (step === 2) return (
    <Wrap {...wp} title="Your" italic="Services." sub="Edit names and prices — these populate your booking page instantly."
      onNext={() => { setErr(''); setStep(3) }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {['core', 'luxury', 'vip', 'addon'].map(cat => {
          const items = svcs.filter(s => s.category === cat)
          if (!items.length) return null
          const catLabel = cat === 'addon' ? 'Add-Ons' : cat === 'vip' ? 'VIP / After Hours' : cat.charAt(0).toUpperCase() + cat.slice(1) + ' Services'
          return (
            <div key={cat}>
              <div style={{ fontSize: 9, letterSpacing: '.4em', textTransform: 'uppercase', color: 'var(--gold)', padding: '12px 4px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />{catLabel}<span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
              </div>
              {items.map((svc) => {
                const idx = svcs.findIndex(x => x === svc)
                return (
                  <div key={idx} style={{ background: 'var(--dark-3)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border-dim)', marginBottom: 2 }}>
                    <input style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-dim)', color: 'var(--text)', padding: '6px 4px', fontSize: 12, flex: 1, outline: 'none', fontFamily: 'inherit' }}
                      value={svc.name} onChange={e => { const u = [...svcs]; u[idx] = { ...u[idx], name: e.target.value }; setSvcs(u) }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--gold)', fontSize: 13 }}>$</span>
                      <input style={{ background: 'var(--dark-2)', border: '1px solid var(--border-dim)', color: 'var(--gold)', padding: '6px 10px', fontSize: 13, width: 72, textAlign: 'center', outline: 'none', fontFamily: 'inherit', borderRadius: 0 }}
                        type="number" value={svc.price} onChange={e => { const u = [...svcs]; u[idx] = { ...u[idx], price: +e.target.value }; setSvcs(u) }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </Wrap>
  )

  if (step === 3) return (
    <Wrap {...wp} title="Hours &" italic="Passcode." sub="Set your available hours and create a secure passcode for your dashboard."
      onNext={() => { if (!info.passcode || info.passcode.length < 4) { setErr('Create a passcode of at least 4 characters.'); return } setErr(''); submit() }}
      nextLabel="Launch My Platform →">
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Operating Hours</div>
        {Object.entries(DAYS).map(([day, label]) => (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'var(--dark-3)', border: '1px solid var(--border-dim)', marginBottom: 2 }}>
            <input type="checkbox" checked={!!hours[day]} onChange={e => setHours(prev => ({ ...prev, [day]: e.target.checked ? { open: '8:00 AM', close: '6:00 PM' } : null }))} />
            <span style={{ fontSize: 12, width: 90, color: hours[day] ? 'var(--text)' : 'var(--muted)', flexShrink: 0 }}>{label}</span>
            {hours[day] ? (
              <>
                <select style={{ background: 'var(--dark-2)', border: '1px solid var(--border-dim)', color: 'var(--text)', padding: '7px 10px', fontSize: 11, outline: 'none', borderRadius: 0, flex: 1 }}
                  value={hours[day].open} onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}>
                  {OPENS.map(t => <option key={t}>{t}</option>)}
                </select>
                <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>to</span>
                <select style={{ background: 'var(--dark-2)', border: '1px solid var(--border-dim)', color: 'var(--text)', padding: '7px 10px', fontSize: 11, outline: 'none', borderRadius: 0, flex: 1 }}
                  value={hours[day].close} onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}>
                  {CLOSES.map(t => <option key={t}>{t}</option>)}
                </select>
              </>
            ) : <span style={{ fontSize: 11, color: 'var(--muted)' }}>Closed</span>}
          </div>
        ))}
      </div>
      <div>
        <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>Dashboard Passcode *</label>
        <input className="input" type="password" placeholder="Minimum 4 characters" value={info.passcode} onChange={e => set('passcode', e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>You'll use this to log into your dashboard. Keep it safe.</div>
      </div>
    </Wrap>
  )

  if (step === 5) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 56, marginBottom: 28, color: 'var(--gold)' }}>✦</div>
        <div className="cinzel" style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '.35em', marginBottom: 20 }}>Platform Live</div>
        <h2 className="cormorant" style={{ fontSize: 60, fontWeight: 300, marginBottom: 20, lineHeight: 1.05 }}>
          {info.shop_name}<br />is <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>ready.</em>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.9 }}>Your website, 8 automations, and full dashboard are live. Opening your dashboard now...</p>
      </div>
    </div>
  )

  return null
}
