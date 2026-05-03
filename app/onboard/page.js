'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sb } from '../../lib/supabase'
import { TEMPLATE_LIST } from '../../lib/templates'
import '../globals.css'

const TYPES = ['barbershop', 'nail', 'lash', 'hair', 'spa', 'tattoo', 'other']

const VIBE_SUGGESTIONS = [
  'clean modern minimalist',
  'bold urban street',
  'classic vintage barbershop',
  'luxury high-end',
  'beach coastal relaxed',
  'rugged mountain cabin',
]

const TOTAL_STEPS = 5

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

export default function Onboard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState({ shop_name: '', owner_name: '', phone: '', email: '', password: '', city: '', state: '', address: '', salon_type: 'barbershop' })
  const [coreSvcs, setCoreSvcs] = useState([{ name: '', price: '', duration: '30' }])
  const [addons, setAddons] = useState([{ name: '', price: '', duration: '0' }])
  const [templateId, setTemplateId] = useState('luxury')
  const [heroImageUrl, setHeroImageUrl] = useState('')
  const [instagram, setInstagram] = useState('')
  const [vibe, setVibe] = useState('')
  const [siteContent, setSiteContent] = useState(null)
  const [createdSalon, setCreatedSalon] = useState(null)

  const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const goBack = () => step === 1 ? router.push('/') : (setStep(s => s - 1), setErr(''))
  const set = (key, val) => setInfo(prev => ({ ...prev, [key]: val }))

  const updateSvc = (list, setList, idx, key, val) => {
    const u = [...list]; u[idx] = { ...u[idx], [key]: val }; setList(u)
  }
  const addSvc = (list, setList) => setList([...list, { name: '', price: '', duration: '30' }])
  const removeSvc = (list, setList, idx) => list.length > 1 ? setList(list.filter((_, i) => i !== idx)) : null

  // STEP 4 trigger: signup + create salon + generate site copy
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
            salon_type: info.salon_type, slug, vibe,
            template_id: templateId,
            hero_image_url: heroImageUrl.trim() || null,
            instagram: igClean,
            subscription_status: 'trial', subscription_tier: 'basic',
            onboarded: false, _services: svcRows,
          }
        })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Signup failed')

      // Sign in
      await sb().auth.signInWithPassword({ email: info.email, password: info.password })
      setCreatedSalon(result.salon)

      // Generate site content (best-effort; not blocking on errors)
      if (vibe.trim()) {
        try {
          const { data: { session } } = await sb().auth.getSession()
          const genRes = await fetch('/api/generate-site', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
            body: JSON.stringify({
              salon_id: result.salon?.id, vibe,
              shop_name: info.shop_name, salon_type: info.salon_type,
              city: info.city, state: info.state, owner_name: info.owner_name
            })
          })
          const genData = await genRes.json()
          setSiteContent(genData.site_content || null)
        } catch {}
      }
      setStep(5)
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
      setStep(6)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  const wp = (s) => ({ step: s, total: TOTAL_STEPS, onBack: goBack, loading, err })

  // ========== STEP 1: Shop Info ==========
  if (step === 1) return (
    <Wrap {...wp(1)} title="Your Shop" italic="Info." sub="This powers your booking page, your dashboard login, and the AI receptionist."
      onNext={() => {
        if (!info.shop_name.trim() || !info.owner_name.trim() || !info.phone.trim()) { setErr('Shop name, owner name, and phone are required.'); return }
        if (!info.email.trim()) { setErr('Email is required.'); return }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email.trim())) { setErr('Please enter a valid email address.'); return }
        if (!info.password || info.password.length < 8) { setErr('Password must be at least 8 characters.'); return }
        setErr(''); setStep(2)
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
          <FL>Salon Type</FL>
          <select className="input" value={info.salon_type} onChange={e => set('salon_type', e.target.value)}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
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

  // ========== STEP 2: Services ==========
  const SvcRow = ({ list, setList, idx, item }) => (
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

  const SvcHeader = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px 68px 28px', gap: 6, padding: '0 2px 6px' }}>
      <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)' }}>Service</span>
      <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Price (opt)</span>
      <span style={{ fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>Mins</span>
      <span />
    </div>
  )

  if (step === 2) return (
    <Wrap {...wp(2)} title="Your" italic="Services." sub="Add your core services and optional add-ons. You can edit these later in your dashboard."
      onNext={() => {
        if (!coreSvcs.some(s => s.name.trim())) { setErr('Add at least one core service.'); return }
        setErr(''); setStep(3)
      }}>
      <div style={{ border: '1px solid var(--border-dim)', background: 'var(--dark-3)', marginBottom: 20 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-dim)', background: 'rgba(201,168,76,0.06)' }}>
          <div style={{ fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>Core Services</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Your main offerings — fades, haircuts, nails, etc.</div>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SvcHeader />
          {coreSvcs.map((s, i) => <SvcRow key={i} list={coreSvcs} setList={setCoreSvcs} idx={i} item={s} />)}
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
          {addons.map((s, i) => <SvcRow key={i} list={addons} setList={setAddons} idx={i} item={s} />)}
          <button onClick={() => addSvc(addons, setAddons)} style={{ background: 'none', border: '1px dashed var(--border-dim)', color: 'var(--muted)', padding: '8px', fontSize: 11, cursor: 'pointer', letterSpacing: '.15em', textTransform: 'uppercase', marginTop: 2 }}>+ Add Add-On</button>
        </div>
      </div>
    </Wrap>
  )

  // ========== STEP 3: Pick Your Style (template) ==========
  if (step === 3) return (
    <Wrap {...wp(3)} title="Pick Your" italic="Style." sub="Choose the look of your booking page. You can switch templates anytime from your dashboard."
      onNext={() => { setErr(''); setStep(4) }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {TEMPLATE_LIST.map(tpl => {
          const selected = templateId === tpl.id
          return (
            <button key={tpl.id} onClick={() => setTemplateId(tpl.id)}
              style={{
                padding: 0,
                background: 'transparent',
                border: `2px solid ${selected ? 'var(--gold)' : 'var(--border-dim)'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .15s',
                overflow: 'hidden',
              }}>
              <div style={{ height: 90, display: 'flex' }}>
                {tpl.swatchColors.map((c, i) => (
                  <div key={i} style={{ flex: 1, background: c }} />
                ))}
              </div>
              <div style={{ padding: '14px 14px 16px' }}>
                <div style={{ fontSize: 13, color: selected ? 'var(--gold)' : 'var(--text)', fontWeight: 500, marginBottom: 5 }}>{tpl.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.55 }}>{tpl.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </Wrap>
  )

  // ========== STEP 4: Personalize + Vibe + Sign-up trigger ==========
  if (step === 4) return (
    <Wrap {...wp(4)} title="Make it" italic="Yours." sub="Add a photo, link your Instagram, and tell us your vibe. The AI will write your booking page copy when you continue."
      onNext={finalizeSignup}
      loading={loading}
      nextLabel={loading ? 'Creating your shop...' : 'Generate & Activate →'}
      canNext={true}>
      <div style={{ marginBottom: 22 }}>
        <FL>Shop Photo URL (optional)</FL>
        <input className="input" placeholder="https://example.com/your-shop.jpg"
          value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          Paste a direct image URL to use a real photo of your shop as the hero. Best at 1920×1080 or wider. Skip if you want to use the template's default scene.
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <FL>Instagram Handle (optional)</FL>
        <input className="input" placeholder="@yourshop"
          value={instagram} onChange={e => setInstagram(e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          Adds a "Follow on Instagram" button under your shop name. With or without the @, or paste the full IG URL.
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FL>Describe your vibe (optional)</FL>
        <input className="input" placeholder="e.g. clean modern, bold urban, classic vintage"
          value={vibe} onChange={e => setVibe(e.target.value)} />
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, lineHeight: 1.6 }}>
          Used by AI to write your tagline + about section. Skip if you'd rather edit copy yourself later.
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {VIBE_SUGGESTIONS.map(v => (
            <button key={v} onClick={() => setVibe(v)}
              style={{ background: vibe === v ? 'rgba(201,168,76,0.12)' : 'transparent', border: `1px solid ${vibe === v ? 'var(--gold)' : 'var(--border-dim)'}`, color: vibe === v ? 'var(--gold)' : 'var(--muted)', padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}>
              {v}
            </button>
          ))}
        </div>
      </div>
    </Wrap>
  )

  // ========== STEP 5: Business Line ==========
  if (step === 5) return (
    <Wrap {...wp(5)} title="Your Business" italic="Line." sub="Your AI receptionist is ready. Here's how clients will reach you."
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

      {siteContent && (
        <div style={{ background: 'var(--dark-3)', border: '1px solid var(--border-dim)', padding: '20px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>AI-Generated Site Preview</div>
          <div style={{ fontSize: 18, color: 'var(--text)', marginBottom: 6, fontFamily: 'Cormorant Garamond, serif' }}>{siteContent.tagline}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>{siteContent.hero_description}</div>
        </div>
      )}
    </Wrap>
  )

  // ========== STEP 6: Done ==========
  if (step === 6) return (
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
