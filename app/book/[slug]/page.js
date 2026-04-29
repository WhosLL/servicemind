'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../../globals.css'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

function parseTime24(t) {
  if (!t) return 0
  if (t.includes(':') && !t.includes(' ')) {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + (m || 0)
  }
  const [time, period] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + (m || 0)
}

function minsToDisplay(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const dh = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${dh}:${min.toString().padStart(2, '0')} ${period}`
}

function googleCalUrl(salon, serviceName, duration, date, time) {
  const start = new Date(`${date}T12:00:00`)
  const mins = parseTime24(time)
  start.setHours(Math.floor(mins / 60), mins % 60, 0)
  const end = new Date(start.getTime() + (duration || 30) * 60000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(serviceName + ' at ' + salon.shop_name)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent('Booked via ServiceMind')}&location=${encodeURIComponent([salon.address, salon.city, salon.state].filter(Boolean).join(', '))}`
}

const gold = '#C9A84C', dark = '#0a0a0a', dark2 = '#111', dark3 = '#1a1a1a', muted = '#777', border = '#222'

export default function BookPage({ params, searchParams }) {
  const { slug } = params
  const refCode = searchParams?.ref || null
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [existingAppts, setExistingAppts] = useState([])

  const [selectedService, setSelectedService] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState(null)
  const [bookStep, setBookStep] = useState('service') // service, addons, date, time, info

  useEffect(() => {
    const load = async () => {
      const { data: s } = await supabase.from('salons').select('*').eq('slug', slug).single()
      if (!s) { setNotFound(true); setLoading(false); return }
      setSalon(s)
      const { data: svcs } = await supabase.from('salon_services').select('*').eq('salon_id', s.id).eq('is_active', true).order('sort_order')
      setServices(svcs || [])
      setLoading(false)
    }
    load()
  }, [slug])

  // Load existing appointments when date selected
  useEffect(() => {
    if (!selectedDate || !salon) return
    const dateStr = selectedDate.toISOString().split('T')[0]
    supabase.from('salon_appointments').select('appointment_time, service_name')
      .eq('salon_id', salon.id).eq('appointment_date', dateStr)
      .neq('status', 'cancelled')
      .then(({ data }) => setExistingAppts(data || []))
  }, [selectedDate, salon])

  const schedule = useMemo(() => {
    if (!salon) return null
    if (salon.schedule_settings) {
      const ss = typeof salon.schedule_settings === 'string' ? JSON.parse(salon.schedule_settings) : salon.schedule_settings
      if (ss.days) return ss
    }
    // Fallback to hours field
    if (salon.hours) {
      const h = typeof salon.hours === 'string' ? JSON.parse(salon.hours) : salon.hours
      const days = {}
      const dayMap = { sun: 'sunday', mon: 'monday', tue: 'tuesday', wed: 'wednesday', thu: 'thursday', fri: 'friday', sat: 'saturday' }
      Object.entries(h).forEach(([k, v]) => {
        const full = dayMap[k] || k
        if (v) {
          days[full] = { enabled: true, open: v.open, close: v.close }
        } else {
          days[full] = { enabled: false, open: '09:00', close: '17:00' }
        }
      })
      return { days, slot_duration: 30, buffer_minutes: 0, blocked_dates: [] }
    }
    return null
  }, [salon])

  const coreServices = useMemo(() => services.filter(s => s.category !== 'addon'), [services])
  const addonServices = useMemo(() => services.filter(s => s.category === 'addon'), [services])

  const totalPrice = useMemo(() => {
    let t = selectedService?.price || 0
    selectedAddons.forEach(a => { t += a.price || 0 })
    return t
  }, [selectedService, selectedAddons])

  const totalDuration = useMemo(() => {
    let d = selectedService?.duration_minutes || 30
    selectedAddons.forEach(a => { d += a.duration_minutes || 0 })
    return d
  }, [selectedService, selectedAddons])

  const DAYS_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  const getAvailableDates = useCallback(() => {
    if (!schedule) return []
    const dates = []
    const today = new Date()
    const blocked = schedule.blocked_dates || []
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dayName = DAYS_FULL[d.getDay()]
      const dayCfg = schedule.days?.[dayName]
      const dateStr = d.toISOString().split('T')[0]
      if (dayCfg?.enabled && !blocked.includes(dateStr)) dates.push(d)
    }
    return dates
  }, [schedule])

  const getTimeSlots = useCallback(() => {
    if (!selectedDate || !schedule) return []
    const dayName = DAYS_FULL[selectedDate.getDay()]
    const dayCfg = schedule.days?.[dayName]
    if (!dayCfg?.enabled) return []

    const openMin = parseTime24(dayCfg.open)
    const closeMin = parseTime24(dayCfg.close)
    const slotDur = schedule.slot_duration || 30
    const buffer = schedule.buffer_minutes || 0
    const step = slotDur + buffer

    const bookedTimes = new Set(existingAppts.map(a => a.appointment_time))
    const slots = []
    for (let t = openMin; t + totalDuration <= closeMin; t += step) {
      const display = minsToDisplay(t)
      if (!bookedTimes.has(display)) slots.push(display)
    }
    return slots
  }, [selectedDate, schedule, existingAppts, totalDuration])

  const handleBook = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return
    setSubmitting(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      const addonNames = selectedAddons.map(a => a.name)
      const serviceName = addonNames.length ? `${selectedService.name} + ${addonNames.join(', ')}` : selectedService.name

      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salon.id,
          client_name: clientName.trim(),
          client_phone: clientPhone.trim(),
          service_id: selectedService.id,
          service_name: selectedService.name,
          addon_ids: selectedAddons.map(a => a.id),
          addon_names: addonNames,
          total_price: totalPrice,
          appointment_date: dateStr,
          appointment_time: selectedTime,
          notes: clientNotes.trim(),
          referral_code: refCode,
          sms_consent: smsConsent
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Booking failed')

      setBooked({
        serviceName,
        service: selectedService,
        date: dateStr,
        time: selectedTime,
        totalPrice,
        calUrl: googleCalUrl(salon, serviceName, totalDuration, dateStr, selectedTime)
      })
    } catch (e) {
      alert('Booking failed: ' + (e.message || 'Please try again.'))
    }
    setSubmitting(false)
  }

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => prev.find(a => a.id === addon.id) ? prev.filter(a => a.id !== addon.id) : [...prev, addon])
  }

  const formatDateShort = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: gold, fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif' }}>Loading...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, color: gold, marginBottom: 20 }}>404</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, color: '#eee', marginBottom: 12 }}>Shop not found</div>
        <div style={{ color: muted, fontSize: 14 }}>This booking link doesn't match any shop.</div>
      </div>
    </div>
  )

  if (booked) return (
    <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 48, color: gold, marginBottom: 20 }}>&#10003;</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: gold, letterSpacing: '.35em', marginBottom: 16 }}>CONFIRMED</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: '#eee', fontWeight: 300, marginBottom: 32, lineHeight: 1.2 }}>
          You're <em style={{ color: gold, fontStyle: 'italic' }}>booked.</em>
        </div>
        <div style={{ background: dark3, border: `1px solid ${border}`, padding: 28, marginBottom: 24 }}>
          <div style={{ fontSize: 16, color: '#eee', marginBottom: 8 }}>{booked.serviceName}</div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{new Date(booked.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{booked.time}</div>
          <div style={{ fontSize: 16, color: gold, marginTop: 12 }}>${booked.totalPrice}</div>
        </div>
        <a href={booked.calUrl} target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', padding: '14px 32px', border: `1px solid ${gold}`, color: gold, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'Cinzel, serif', marginBottom: 16 }}>
          Add to Calendar
        </a>
        <div style={{ fontSize: 12, color: muted, marginTop: 16 }}>See you at {salon.shop_name}!</div>
      </div>
    </div>
  )

  // Summary bar
  const Summary = () => (
    selectedService ? (
      <div style={{ background: dark3, border: `1px solid ${border}`, padding: '14px 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, color: '#eee' }}>{selectedService.name}</div>
            {selectedAddons.length > 0 && (
              <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>+ {selectedAddons.map(a => a.name).join(', ')}</div>
            )}
            {selectedDate && <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{formatDateShort(selectedDate)}{selectedTime ? ` at ${selectedTime}` : ''}</div>}
          </div>
          <div style={{ color: gold, fontSize: 18, fontFamily: 'Cormorant Garamond, serif' }}>${totalPrice}</div>
        </div>
      </div>
    ) : null
  )

  // Group core services by category
  const grouped = {}
  coreServices.forEach(s => {
    const cat = s.category || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  })
  const catOrder = ['core', 'luxury', 'vip']
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const ai = catOrder.indexOf(a.toLowerCase()); const bi = catOrder.indexOf(b.toLowerCase())
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <div style={{ minHeight: '100vh', background: dark, padding: '0 0 60px' }}>
      <div style={{ padding: '32px 24px', textAlign: 'center', borderBottom: `1px solid ${border}` }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: gold, letterSpacing: '.35em', marginBottom: 8 }}>SERVICEMIND</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#eee', fontWeight: 300, lineHeight: 1.1 }}>{salon.shop_name}</div>
        <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>{[salon.salon_type, salon.city, salon.state].filter(Boolean).join(' Â· ')}</div>
        {salon.phone && <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{salon.phone}</div>}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* SELECT SERVICE */}
        {bookStep === 'service' && (
          <div style={{ paddingTop: 28 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 20, textTransform: 'uppercase' }}>Select a Service</div>
            {sortedCats.map(cat => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: muted, marginBottom: 8, paddingLeft: 2 }}>{cat}</div>
                {grouped[cat].map(svc => (
                  <button key={svc.id} onClick={() => { setSelectedService(svc); setSelectedAddons([]); setBookStep(addonServices.length > 0 ? 'addons' : 'date') }}
                    style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: dark2, border: `1px solid ${border}`, color: '#eee', cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: 14, marginBottom: 3 }}>{svc.name}</div>
                      <div style={{ fontSize: 11, color: muted }}>{svc.duration_minutes} min{svc.description ? (' · ' + svc.description) : ''}</div>
                    </div>
                    <div style={{ color: gold, fontSize: 16, fontFamily: 'Cormorant Garamond, serif', flexShrink: 0, marginLeft: 12 }}>${svc.price}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* SELECT ADD-ONS */}
        {bookStep === 'addons' && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => { setBookStep('service'); setSelectedService(null) }} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '8px 16px', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>&#8592; Back</button>
            <Summary />
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 16, textTransform: 'uppercase' }}>Add Extras (optional)</div>
            {addonServices.map(addon => {
              const isSelected = selectedAddons.find(a => a.id === addon.id)
              return (
                <button key={addon.id} onClick={() => toggleAddon(addon)}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: isSelected ? 'rgba(201,168,76,0.08)' : dark2, border: `1px solid ${isSelected ? gold : border}`, color: '#eee', cursor: 'pointer', marginBottom: 2, textAlign: 'left', transition: 'all .2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 20, height: 20, border: `1px solid ${isSelected ? gold : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: gold, flexShrink: 0 }}>
                      {isSelected ? '✓' : ''}
                    </div>
                    <div style={{ fontSize: 13 }}>{addon.name}</div>
                  </div>
                  <div style={{ color: gold, fontSize: 14, flexShrink: 0 }}>+${addon.price}</div>
                </button>
              )
            })}
            <button onClick={() => setBookStep('date')}
              style={{ width: '100%', padding: '16px', background: gold, border: 'none', color: dark, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif', cursor: 'pointer', marginTop: 16 }}>
              Continue &#8594;
            </button>
          </div>
        )}

        {/* SELECT DATE */}
        {bookStep === 'date' && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => setBookStep(addonServices.length > 0 ? 'addons' : 'service')} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '8px 16px', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>&#8592; Back</button>
            <Summary />
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 16, textTransform: 'uppercase' }}>Pick a Date</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {getAvailableDates().map((d, i) => (
                <button key={i} onClick={() => { setSelectedDate(d); setSelectedTime(null); setBookStep('time') }}
                  style={{ padding: '14px 8px', background: dark2, border: `1px solid ${border}`, color: '#eee', cursor: 'pointer', fontSize: 12, textAlign: 'center' }}>
                  {formatDateShort(d)}
                </button>
              ))}
            </div>
            {getAvailableDates().length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: muted, fontSize: 13 }}>No available dates. Please check back later.</div>
            )}
          </div>
        )}

        {/* SELECT TIME */}
        {bookStep === 'time' && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => { setBookStep('date'); setSelectedDate(null) }} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '8px 16px', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>&#8592; Back</button>
            <Summary />
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 16, textTransform: 'uppercase' }}>Pick a Time</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {getTimeSlots().map((t, i) => (
                <button key={i} onClick={() => { setSelectedTime(t); setBookStep('info') }}
                  style={{ padding: '14px 8px', background: dark2, border: `1px solid ${border}`, color: '#eee', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}>
                  {t}
                </button>
              ))}
            </div>
            {getTimeSlots().length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: muted, fontSize: 13 }}>No available slots for this date. Try another day.</div>
            )}
          </div>
        )}

        {/* CLIENT INFO */}
        {bookStep === 'info' && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => { setBookStep('time'); setSelectedTime(null) }} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '8px 16px', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>&#8592; Back</button>
            <Summary />
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 16, textTransform: 'uppercase' }}>Your Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: muted, display: 'block', marginBottom: 6 }}>Name *</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Your name"
                  style={{ width: '100%', padding: '14px 16px', background: dark2, border: `1px solid ${border}`, color: '#eee', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: muted, display: 'block', marginBottom: 6 }}>Phone *</label>
                <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="(555) 000-0000" type="tel"
                  style={{ width: '100%', padding: '14px 16px', background: dark2, border: `1px solid ${border}`, color: '#eee', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: muted, display: 'block', marginBottom: 6 }}>Notes (optional)</label>
                <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} placeholder="Anything we should know?" rows={3}
                  style={{ width: '100%', padding: '14px 16px', background: dark2, border: `1px solid ${border}`, color: '#eee', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div style={{ padding: '12px 14px', background: dark2, border: `1px solid ${border}` }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 11, color: muted, lineHeight: 1.6 }}>
                  <input type="checkbox" checked={smsConsent} onChange={e => setSmsConsent(e.target.checked)}
                    style={{ marginTop: 3, accentColor: gold, flexShrink: 0, cursor: 'pointer' }} />
                  <span>
                    I agree to receive SMS messages from <strong style={{ color: '#ddd' }}>{salon.shop_name}</strong> for booking confirmations, reminders, and occasional promotions. Msg &amp; data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help. By checking, I agree to ServiceMind&apos;s{' '}
                    <a href="/terms" target="_blank" rel="noreferrer" style={{ color: gold, textDecoration: 'underline' }}>Terms</a>{' '}and{' '}
                    <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: gold, textDecoration: 'underline' }}>Privacy Policy</a>.
                  </span>
                </label>
              </div>
              <button onClick={handleBook} disabled={submitting || !clientName.trim() || !clientPhone.trim() || !smsConsent}
                style={{ padding: '16px', background: gold, border: 'none', color: dark, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif', cursor: 'pointer', marginTop: 8, opacity: submitting || !clientName.trim() || !clientPhone.trim() || !smsConsent ? 0.5 : 1 }}>
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
