'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
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
  const [svcs, setSvcs] = useState([{ name: '', price: '', duration: '30' }])
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
      await sb().from('salon_services').insert(svcs.filter(s => s.name.trim()).map((s, i) => ({ salon_id: salon.id, name: s.name.trim(), price: parseFloat(s.price) || 0, duration: parseInt(s.duration) || 30, category: 'core', sort_order: i, is_active: true })))
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

  const addSvc = () => setSvcs(prev => [...prev, { name: '', price: '', duration: '30' }])
  const removeSvc = (i) => setSvcs(prev => prev.filter((_, idx) => idx !== i))
  const updateSvc = (i, key, val) => setSvcs(prev => { const u = [...prev]; u[i] = { ...u[i], [key]: val }; return u })

  if (step === 2) return (
    <Wrap {...wp} title="Your" italic="Services." sub="Add every service you offer. You can always edit these later from your dashboard."
      onNext={() => {
        const valid = svcs.filter(s => s.name.trim())
        if (!valid.length) { setErr('Add at least one service.'); return }
        setSvcs(valid)
        setErr(''); setStep(3)
      }}>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 36px', gap: 8, marginBottom: 8, padding: '0 4px' }}>
          <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Service Name</span>
          <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Price</span>
          <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Mins</span>
          <span />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {svcs.map((svc, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 36px', gap: 8, alignItems: 'center' }}>
              <input className="input" placeholder="e.g. Haircut & Beard Combo" value={svc.name}
                onChange={e => updateSvc(i, 'name', e.target.value)}
                style={{ padding: '12px 14px', fontSize: 13 }} />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', fontSize: 12, pointerEvents: 'none' }}>$</span>
                <input className="input" type="number" placeholder="0" value={svc.price}
                  onChange={e => updateSvc(i, 'price', e.target.value)}
                  style={{ padding: '12px 10px 12px 22px', fontSize: 13, textAlign: 'right' }} />
              </div>
              <input className="input" type="number" placeholder="30" value={svc.duration}
                onChange={e => updateSvc(i, 'duration', e.target.value)}
                style={{ padding: '12px 10px', fontSize: 13, textAlign: 'center' }} />
              <button onClick={() => removeSvc(i)} disabled={svcs.length === 1}
                style={{ background: 'none', border: '1px solid var(--border-dim)', color: 'var(--muted)', width: 36, height: 36, cursor: svcs.length === 1 ? 'not-allowed' : 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: svcs.length === 1 ? 0.3 : 1 }}>
                ×
              </button>
            </div>
          ))}
        </div>
        <button onClick={addSvc} className="btn-ghost"
          style={{ marginTop: 16, width: '100%', padding: '12px', fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase' }}>
          + Add Service
        </button>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.7 }}>
          Add as many as you offer. Price and duration can be edited anytime from your dashboard.
        </p>
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
