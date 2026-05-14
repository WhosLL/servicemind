'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import { TEMPLATE_LIST } from '../../lib/templates'
import TemplatePreview from './_TemplatePreview'
import '../globals.css'

const SHOP_TYPES = [
  { id: 'barbershop',   label: 'Barbershop',          emoji: '💈' },
  { id: 'hair',         label: 'Hair Salon',          emoji: '💇' },
  { id: 'nail',         label: 'Nail Salon',          emoji: '💅' },
  { id: 'lash',         label: 'Lash / Brow',         emoji: '👁️' },
  { id: 'esthetician',  label: 'Esthetician / Skincare', emoji: '✨' },
  { id: 'laser',        label: 'Laser Hair Removal',  emoji: '🔆' },
  { id: 'massage',      label: 'Massage Therapy',     emoji: '💆' },
  { id: 'spa',          label: 'Spa',                 emoji: '🧖' },
  { id: 'makeup',       label: 'Makeup Artist',       emoji: '💄' },
  { id: 'tattoo',       label: 'Tattoo / Piercing',   emoji: '🖋️' },
  { id: 'mobile',       label: 'Mobile Service',      emoji: '🚐' },
  { id: 'tanning',      label: 'Tanning',             emoji: '☀️' },
  { id: 'other',        label: 'Other',               emoji: '➕' },
]

const TOTAL_STEPS = 6

function Progress({ step, total, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 44 }}>
      <button onClick={onBack} className="btn-ghost" style={{ fontSize: 10, padding: '9px 18px' }}>← Back</button>
      <div style={{ display: 'flex', gap: 5, flex: 1 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{ height: 2, flex: i < step ? 1 : '.4', background: i < step ? 'var(--gold)' : 'var(--border-dim)', transition: 'all .3s' }} />
        ))}
      </div>
      <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.2em', textTransform: 'uppercase', flexShrink: 0 }}>
        {step} / {total}
      </span>
    </div>
  )
}

function Wrap({ step, total, onBack, title, italic, sub, children, onNext, nextLabel = 'Continue →', canNext = true, loading, err }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--black)' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
        <Progress step={step} total={total} onBack={onBack} />
        <div className="card-gold" style={{ padding: '48px 48px' }}>
          <div className="gold-line-top" />
          <div className="eyebrow" style={{ marginBottom: 20 }}>Setup — Step {step} of {total}</div>
          <h2 className="cormorant" style={{ fontSize: 44, fontWeight: 300, lineHeight: 1.1, marginBottom: 8 }}>
            {title} <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{italic}</em>
          </h2>
          {sub && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.8 }}>{sub}</p>}
          <div style={{ marginTop: 32 }}>{children}</div>
          {err && <div style={{ fontSize: 12, color: '#ff7070', margin: '16px 0' }}>{err}</div>}
          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onNext} disabled={!canNext || loading} className="btn-gold"
              style={{ padding: '16px 40px', opacity: canNext && !loading ? 1 : .45 }}>
              {loading ? 'Working...' : nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const FL = ({ children }) => (
  <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>{children}</label>
)

// NOTE: Defined at module scope (NOT inside Onboard) so React doesn't remount
// each row on every keystroke. The previous version was an inline component
// inside Onboard's render — every state change recreated the component
// identity, React unmounted/remounted, and the input lost focus per character.
function SvcRow({ list, setList, idx, item, updateSvc, removeSvc }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px 68px 28px', gap: 6, alignItems: 'center' }}>
      <input className="input" placeholder="Service name" value={item.name} onChange={e => updateSvc(list, setList, idx, 'name', e.target.value)} style={{ padding: '10px 12px', fontSize: 12 }} />
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: item.price ? 'var(--gold)' : 'var(--muted)', fontSize: 11, pointerEvents: 'none' }}>$</span>
        <input className="input" type="number" placeholder="" value={item.price} onChange={e => updateSvc(list, setList, idx, 'price', e.target.value)} style={{ padding: '10px 8px 10px 20px', fontSize: 12, textAlign: 'right' }} />
      </div>
      <input className="input" type="number" placeholder="30" value={item.duration} onChange={e => updateSvc(list, setList, idx, 'duration', e.target.value)} style={{ padding: '10px 8px', fontSize: 12, textAlign: 'center' }} />
      <button onClick={() => removeSvc(list, setList, idx)} disabled={list.length === 1} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: list.length === 1 ? 'not-allowed' : 'pointer', fontSize: 16, opacity: list.length === 1 ? 0.2 : 0.5, padding: 0 }}>×</button>
    </div>
  )
}

function SvcHeader() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px 68px 28px', gap: 6, padding: '0 2px 6px' }}>
      <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Service</span>
      <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Price (opt)</span>
      <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Mins</span>
      <span />
    </div>
  )
}

export default function Onboard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState({ shop_name: '', owner_name: '', phone: '', email: '', password: '', city: '', state: '', address: '', salon_type: '' })
  const [coreSvcs, setCoreSvcs] = useState([{ name: '', price: '', duration: '30' }])
  const [addons, setAddons] = useState([{ name: '', price: '', duration: '0' }])
  const [templateId, setTemplateId] = useState('luxury')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [instagram, setInstagram] = useState('')
  const [createdSalon, setCreatedSalon] = useState(null)

  // Check if an email is already registered before user wastes time on later steps.
  const checkEmailTaken = async (email) => {
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) return false   // fail open — let server-side signup catch it later
      const data = await res.json()
      return !!data.exists
    } catch { return false }
  }

  const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const goBack = () => step === 1 ? router.push('/') : (setStep(s => s - 1), setErr(''))
  const set = (key, val) => setInfo(prev => ({ ...prev, [key]: val }))

  const updateSvc = (list, setList, idx, key, val) => {
    const u = [...list]; u[idx] = { ...u[idx], [key]: val }; setList(u)
  }
  const addSvc = (list, setList) => setList([...list, { name: '', price: '', duration: '30' }])
  const removeSvc = (list, setList, idx) => list.length > 1 ? setList(list.filter((_, i) => i !== idx)) : null

  // STEP 5 trigger: signup + create salon
  const finalizeSignup = async () => {
    setLoading(true); setErr('')
    try {
      const slug = slugify(info.shop_name) + '-' + Math.random().toString(36).slice(2, 6)
      const svcRows = [
        ...coreSvcs.filter(s => s.name.trim()).map((s, i) => ({ name: s.name.trim(), price: parseFloat(s.price) || 0, duration_minutes: parseInt(s.duration) || 30, category: 'core', is_addon: false, sort_order: i })),
        ...addons.filter(s => s.name.trim()).map((s, i) => ({ name: s.name.trim(), price: parseFloat(s.price) || 0, duration_minutes: parseInt(s.duration) || 0, category: 'addon', is_addon: true, sort_order: 100 + i }))
      ]

      const igClean = instagram.trim()
        .replace(/^@/, '')
        .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
        .replace(/^instagram\.com\//, '')
        .split(/[/?#]/)[0] || null

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: info.email,
          password: info.password,
          salonData: {
            shop_name: info.shop_name, owner_name: info.owner_name, phone: info.phone,
            email: info.email, city: info.city, state: info.state, address: info.address,
            salon_type: info.salon_type, slug,
            template_id: templateId,
            hero_image_url: heroImageUrl.trim() || null,
            instagram: igClean,
            subscription_status: 'pending_payment', subscription_tier: 'basic',
            onboarded: false, _services: svcRows,
          }
        })
      })
      const result = await res.json()
      if (!res.ok) {
        if (result.code === 'SHOP_PRE_PROVISIONED') {
          setErr('This shop was already set up by ServiceMind. Contact support@servicemind.io to access your account.')
          setLoading(false)
          return
        }
        throw new Error(result.error || 'Signup failed')
      }

      // Sign in immediately so the Checkout call can authenticate.
      await sb().auth.signInWithPassword({ email: info.email, password: info.password })

      // Card upfront — kick the user straight into Stripe Checkout. The webhook
      // will flip subscription_status from 'pending_payment' to 'trialing' when
      // the subscription is created.
      const { data: { session } } = await sb().auth.getSession()
      const checkoutRes = await fetch('/api/billing/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ salon_id: result.salon.id }),
      })
      const checkoutData = await checkoutRes.json()
      if (checkoutData.checkout_url) {
        window.location.href = checkoutData.checkout_url
        return
      }
      // Checkout creation failed — fall through to the success step so the
      // user can retry from the dashboard.
      setCreatedSalon(result.salon)
      setStep(6)
    } catch (e) { setErr(e.message || 'Setup failed.') }
    setLoading(false)
  }

  // Final step: mark onboarded, route to dashboard
  const finalize = async () => {
    setLoading(true); setErr('')
    try {
      if (createdSalon?.id) {
        await sb().from('salons').update({ onboarded: true, onboarded_at: new Date().toISOString() }).eq('id', createdSalon.id)
      }
      setStep(7)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  const wp = (s) => ({ step: s, total: TOTAL_STEPS, onBack: goBack, loading, err })

  // ========== STEP 1: Shop Type ==========
  if (step === 1) return (
    <Wrap {...wp(1)} title="What kind of" italic="shop?" sub="Pick the closest fit. This shapes your booking page templates, the AI receptionist's tone, and which automations come pre-configured."
      onNext={() => {
        if (!info.salon_type) { setErr('Pick a shop type to continue.'); return }
        setErr(''); setStep(2)
      }}
      canNext={!!info.salon_type}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {SHOP_TYPES.map(t => {
          const selected = info.salon_type === t.id
          return (
            <button key={t.id} onClick={() => set('salon_type', t.id)}
              style={{
                background: selected ? 'rgba(201,168,76,0.10)' : 'var(--dark-3)',
                border: `1px solid ${selected ? 'var(--gold)' : 'var(--border-dim)'}`,
                color: selected ? 'var(--gold)' : 'var(--text)',
                padding: '20px 12px', cursor: 'pointer', textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                transition: 'border-color .15s, background .15s',
              }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>{t.emoji}</span>
              <span style={{ fontSize: 12, letterSpacing: '.08em', fontWeight: 500 }}>{t.label}</span>
            </button>
          )
        })}
      </div>
    </Wrap>
  )

  // ========== STEP 2: Shop Info ==========
  if (step === 2) return (
    <Wrap {...wp(2)} title="Your Shop" italic="Info." sub="This powers your booking page, your dashboard login, and the AI receptionist."
      onNext={async () => {
        if (!info.shop_name.trim() || !info.owner_name.trim() || !info.phone.trim()) { setErr('Shop name, owner name, and phone are required.'); return }
        if (!info.email.trim()) { setErr('Email is required.'); return }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim())) { setErr('Please enter a valid email address.'); return }
        if (!info.password || info.password.length < 8) { setErr('Password must be at least 8 characters.'); return }
        setLoading(true)
        const taken = await checkEmailTaken(info.email.trim())
        setLoading(false)
        if (taken) {
          setErr('An account with this email already exists. Try signing in instead, or use a different email.')
          return
        }
        setErr(''); setStep(3)
      }}
      canNext={!!info.shop_name}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[['Shop Name *', 'shop_name', 'Your shop name'], ['Owner Name *', 'owner_name', 'Your full name'], ['Phone *', 'phone', '(555) 000-0000'], ['Email *', 'email', 'you@example.com']].map(([label, key, ph]) => (
          <div key={key}>
            <FL>{label}</FL>
            <input className="input" placeholder={ph} value={info[key]} onChange={e => set(key, e.target.value)} type={key === 'email' ? 'email' : 'text'} autoComplete={key === 'email' ? 'email' : 'off'} />
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}>
          <FL>Create a Password *</FL>
          <input className="input" type="password" placeholder="At least 8 characters" value={info.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>You'll use this email & password to log into your dashboard.</div>
        </div>
        <div>
          <FL>Address (optional)</FL>
          <input className="input" placeholder="123 Main Street" value={info.address} onChange={e => set('address', e.target.value)} />
        </div>
        {[['City', 'city', 'Your city'], ['State', 'state', 'XX']].map(([label, key, ph]) => (
          <div key={key}>
            <FL>{label}</FL>
            <input className="input" placeholder={ph} value={info[key]} onChange={e => set(key, e.target.value)} />
          </div>
        ))}
      </div>
    </Wrap>
  )

  // ========== STEP 3: Services ==========
  if (step === 3) return (
    <Wrap {...wp(3)} title="Your" italic="Services." sub="Add your core services and optional add-ons. You can edit these later in your dashboard."
      onNext={() => {
        if (!coreSvcs.some(s => s.name.trim())) { setErr('Add at least one core service.'); return }
        setErr(''); setStep(4)
      }}>
      <div style={{ border: '1px solid var(--border-dim)', background: 'var(--dark-3)', marginBottom: 20 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(201,168,76,0.06)' }}>
          <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Core Services</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Your main offerings — fades, haircuts, nails, etc.</div>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SvcHeader />
          {coreSvcs.map((s, i) => <SvcRow key={i} list={coreSvcs} setList={setCoreSvcs} idx={i} item={s} updateSvc={updateSvc} removeSvc={removeSvc} />)}
          <button onClick={() => addSvc(coreSvcs, setCoreSvcs)} style={{ background: 'none', border: '1px dashed var(--border-dim)', color: 'var(--muted)', padding: '8px', fontSize: 11, cursor: 'pointer', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>+ Add Service</button>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border-dim)', background: 'var(--dark-3)' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(201,168,76,0.03)' }}>
          <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>Add-Ons (optional)</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Extras clients can add — beard trim, hot towel, designs, etc.</div>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SvcHeader />
          {addons.map((s, i) => <SvcRow key={i} list={addons} setList={setAddons} idx={i} item={s} updateSvc={updateSvc} removeSvc={removeSvc} />)}
          <button onClick={() => addSvc(addons, setAddons)} style={{ background: 'none', border: '1px dashed var(--border-dim)', color: 'var(--muted)', padding: '8px', fontSize: 11, cursor: 'pointer', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>+ Add Add-On</button>
        </div>
      </div>
    </Wrap>
  )

  // ========== STEP 4: Pick Your Style (template) ==========
  if (step === 4) return (
    <Wrap {...wp(4)} title="Pick Your" italic="Style." sub="Each preview shows roughly how your booking page will look — fonts, colors, layout. Pick one, you can switch anytime from your dashboard."
      onNext={() => { setErr(''); setStep(5) }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {TEMPLATE_LIST.map(tpl => (
          <TemplatePreview
            key={tpl.id}
            id={tpl.id}
            selected={templateId === tpl.id}
            onClick={() => setTemplateId(tpl.id)}
          />
        ))}
      </div>
    </Wrap>
  )

  // ========== STEP 5: Personalize + Sign-up trigger ==========
  if (step === 5) return (
    <Wrap {...wp(5)} title="Make it" italic="Yours." sub="Add a photo and link your Instagram. You can edit either later from your dashboard."
      onNext={finalizeSignup}
      loading={loading}
      nextLabel={loading ? 'Creating your shop...' : 'Activate →'}
      canNext={true}>
      <div style={{ marginBottom: 22 }}>
        <FL>Shop Photo URL (optional)</FL>
        <input className="input" placeholder="https://example.com/your-shop.jpg"
          value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          Paste a direct image URL to use a real photo of your shop as the hero. Best at 1920×1080 or wider. Skip if you want to use the template's default scene.
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FL>Instagram Handle (optional)</FL>
        <input className="input" placeholder="@yourshop"
          value={instagram} onChange={e => setInstagram(e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          Adds a "Follow on Instagram" button under your shop name. With or without the @, or paste the full IG URL.
        </div>
      </div>
    </Wrap>
  )

  // ========== STEP 6: Business Line ==========
  if (step === 6) return (
    <Wrap {...wp(6)} title="Your Business" italic="Line." sub="Your AI receptionist is ready. Here's how clients will reach you."
      onNext={finalize} nextLabel="Launch My Platform →" loading={loading}>
      {createdSalon?.twilio_phone_number ? (
        <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', padding: '24px', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Your Business Number</div>
          <div style={{ fontSize: 28, color: 'var(--gold)', fontWeight: 500, letterSpacing: '.05em' }}>{createdSalon.twilio_phone_number}</div>
        </div>
      ) : (
        <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: '20px', marginBottom: 24, fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          Your business number will be set up in your dashboard under Settings. You can enable texting there with one click.
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Set Up Call Forwarding</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 16 }}>
          Forward your personal calls to your new business number so the AI can answer when you're busy.
        </div>
        {[
          ['iPhone', 'Settings → Phone → Call Forwarding → Toggle On → Enter your business number'],
          ['Android', 'Phone App → ⋮ Menu → Settings → Supplementary Services → Call Forwarding → Always Forward → Enter number'],
          ['AT&T', 'Dial *21* then your business number then # → Press Call'],
          ['T-Mobile', 'Dial **21* then your business number then # → Press Call'],
          ['Verizon', 'Dial *72 then your business number → Press Call → Wait for confirmation tone'],
        ].map(([device, steps]) => (
          <div key={device} style={{ padding: '12px 16px', background: 'var(--dark-3)', border: '1px solid var(--border-dim)', marginBottom: 2 }}>
            <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>{device}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>{steps}</div>
          </div>
        ))}
      </div>

    </Wrap>
  )

  // ========== STEP 7: Done ==========
  if (step === 7) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 520 }}>
        <div style={{ fontSize: 56, marginBottom: 28, color: 'var(--gold)' }}>✓</div>
        <div className="cinzel" style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '.35em', marginBottom: 20 }}>Platform Live</div>
        <h2 className="cormorant" style={{ fontSize: 60, fontWeight: 300, marginBottom: 20, lineHeight: 1.05 }}>
          {info.shop_name}<br />is <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>ready.</em>
        </h2>
        {createdSalon?.slug && (
          <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border)', padding: '16px 24px', marginBottom: 20, display: 'inline-block' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 6 }}>Your Booking Page</div>
            <div style={{ fontSize: 14, color: 'var(--gold)', fontFamily: 'monospace' }}>servicemind.io/book/{createdSalon.slug}</div>
          </div>
        )}
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.9 }}>Opening your dashboard now...</p>
      </div>
    </div>
  )

  return null
}
