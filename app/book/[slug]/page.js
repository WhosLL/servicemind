'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../../globals.css'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

const DAYS_MAP = ['sun','mon','tue','wed','thu','fri','sat']

function timeToMins(t) {
  if (!t) return 0
  const [time, period] = t.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return h * 60 + m
}

function minsToTime(m) {
  const h = Math.floor(m / 60)
  const min = m % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${min.toString().padStart(2, '0')} ${period}`
}

function getSlots(dayHours, duration = 30) {
  if (!dayHours) return []
  const open = timeToMins(dayHours.open)
  const close = timeToMins(dayHours.close)
  const slots = []
  for (let t = open; t + duration <= close; t += 30) slots.push(minsToTime(t))
  return slots
}

function formatDateShort(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function googleCalUrl(salon, service, date, time) {
  const start = new Date(`${date}T12:00:00`)
  const [t, period] = time.split(' ')
  let [h, m] = t.split(':').map(Number)
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  start.setHours(h, m, 0)
  const end = new Date(start.getTime() + (service.duration_minutes || 30) * 60000)
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(service.name + ' at ' + salon.shop_name)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent('Booked via ServiceMind')}&location=${encodeURIComponent([salon.address, salon.city, salon.state].filter(Boolean).join(', '))}`
}

export default function BookPage({ params }) {
  const { slug } = params
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Booking flow state
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [booked, setBooked] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: s } = await sb.from('salons').select('*').eq('slug', slug).single()
      if (!s) { setNotFound(true); setLoading(false); return }
      setSalon(s)
      const { data: svcs } = await sb.from('salon_services').select('*').eq('salon_id', s.id).eq('is_active', true).order('sort_order')
      setServices(svcs || [])
      setLoading(false)
    }
    load()
  }, [slug])

  const getHours = useCallback(() => {
    if (!salon) return {}
    if (salon.hours) return typeof salon.hours === 'string' ? JSON.parse(salon.hours) : salon.hours
    return {}
  }, [salon])

  const getAvailableDates = useCallback(() => {
    const hours = getHours()
    const dates = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dayKey = DAYS_MAP[d.getDay()]
      if (hours[dayKey]) dates.push(d)
    }
    return dates
  }, [getHours])

  const getTimeSlots = useCallback(() => {
    if (!selectedDate) return []
    const hours = getHours()
    const dayKey = DAYS_MAP[selectedDate.getDay()]
    return getSlots(hours[dayKey], selectedService?.duration_minutes || 30)
  }, [selectedDate, getHours, selectedService])

  const handleBook = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return
    setSubmitting(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      await sb.from('salon_appointments').insert([{
        salon_id: salon.id,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        service_name: selectedService.name,
        service_id: selectedService.id,
        total_price: selectedService.price,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        status: 'confirmed',
        notes: clientNotes.trim() || null
      }])

      // Upsert client
      const { data: existingClient } = await sb
        .from('clients')
        .select('id, total_visits')
        .eq('salon_id', salon.id)
        .eq('phone', clientPhone.trim())
        .single()

      if (existingClient) {
        await sb.from('clients').update({
          total_visits: (existingClient.total_visits || 0) + 1,
          last_visit_at: new Date().toISOString(),
          name: clientName.trim()
        }).eq('id', existingClient.id)
      } else {
        await sb.from('clients').insert([{
          salon_id: salon.id,
          name: clientName.trim(),
          phone: clientPhone.trim(),
          total_visits: 1,
          last_visit_at: new Date().toISOString(),
          source: 'booking_page'
        }])
      }

      setBooked({
        service: selectedService,
        date: dateStr,
        time: selectedTime,
        calUrl: googleCalUrl(salon, selectedService, dateStr, selectedTime)
      })
    } catch (e) {
      alert('Booking failed: ' + (e.message || 'Please try again.'))
    }
    setSubmitting(false)
  }

  // ========= STYLES =========
  const gold = '#C9A84C'
  const dark = '#0a0a0a'
  const dark2 = '#111'
  const dark3 = '#1a1a1a'
  const muted = '#777'
  const border = '#222'

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

  // ========= CONFIRMATION SCREEN =========
  if (booked) return (
    <div style={{ minHeight: '100vh', background: dark, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: 48, color: gold, marginBottom: 20 }}>✓</div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 12, color: gold, letterSpacing: '.35em', marginBottom: 16 }}>CONFIRMED</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, color: '#eee', fontWeight: 300, marginBottom: 32, lineHeight: 1.2 }}>
          You're <em style={{ color: gold, fontStyle: 'italic' }}>booked.</em>
        </div>
        <div style={{ background: dark3, border: `1px solid ${border}`, padding: 28, marginBottom: 24 }}>
          <div style={{ fontSize: 16, color: '#eee', marginBottom: 8 }}>{booked.service.name}</div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{new Date(booked.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div style={{ fontSize: 13, color: muted, marginBottom: 4 }}>{booked.time}</div>
          <div style={{ fontSize: 16, color: gold, marginTop: 12 }}>${ booked.service.price}</div>
        </div>
        <a href={booked.calUrl} target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', padding: '14px 32px', border: `1px solid ${gold}`, color: gold, fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: 'Cinzel, serif', marginBottom: 16 }}>
          Add to Calendar
        </a>
        <div style={{ fontSize: 12, color: muted, marginTop: 16 }}>See you at {salon.shop_name}!</div>
      </div>
    </div>
  )

  // ========= GROUP SERVICES BY CATEGORY =========
  const grouped = {}
  services.forEach(s => {
    const cat = s.category || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  })
  const categoryOrder = ['core', 'luxury', 'vip', 'addon']
  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = categoryOrder.indexOf(a.toLowerCase())
    const bi = categoryOrder.indexOf(b.toLowerCase())
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <div style={{ minHeight: '100vh', background: dark, padding: '0 0 60px' }}>
      {/* HEADER */}
      <div style={{ padding: '32px 24px', textAlign: 'center', borderBottom: `1px solid ${border}` }}>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 11, color: gold, letterSpacing: '.35em', marginBottom: 8 }}>SERVICEMIND</div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#eee', fontWeight: 300, lineHeight: 1.1 }}>
          {salon.shop_name}
        </div>
        <div style={{ fontSize: 12, color: muted, marginTop: 8 }}>
          {[salon.salon_type, salon.city, salon.state].filter(Boolean).join(' · ')}
        </div>
        {salon.phone && <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{salon.phone}</div>}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* STEP 1: SELECT SERVICE */}
        {!selectedService && (
          <div style={{ paddingTop: 28 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 20, textTransform: 'uppercase' }}>Select a Service</div>
            {sortedCategories.map(cat => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: muted, marginBottom: 8, paddingLeft: 2 }}>{cat}</div>
                {grouped[cat].map(svc => (
                  <button key={svc.id} onClick={() => setSelectedService(svc)}
                    style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', background: dark2, border: `1px solid ${border}`, color: '#eee', cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
                    <div>
                      <div style={{ fontSize: 14, marginBottom: 3 }}>{svc.name}</div>
                      <div style={{ fontSize: 11, color: muted }}>{svc.duration_minutes} min{svc.description ? ` · ${svc.description}` : ''}</div>
                    </div>
                    <div style={{ color: gold, fontSize: 16, fontFamily: 'Cormorant Garamond, serif', flexShrink: 0, marginLeft: 12 }}>${ svc.price}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* STEP 2: SELECT DATE */}
        {selectedService && !selectedDate && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => setSelectedService(null)} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '8px 16px', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>← Back</button>
            <div style={{ background: dark3, border: `1px solid ${border}`, padding: '16px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: '#eee' }}>{selectedService.name}</div>
              <div style={{ color: gold }}>${ selectedService.price}</div>
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 16, textTransform: 'uppercase' }}>Pick a Date</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {getAvailableDates().map((d, i) => (
                <button key={i} onClick={() => setSelectedDate(d)}
                  style={{ padding: '14px 8px', background: dark2, border: `1px solid ${border}`, color: '#eee', cursor: 'pointer', fontSize: 12, textAlign: 'center' }}>
                  {formatDateShort(d)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SELECT TIME */}
        {selectedService && selectedDate && !selectedTime && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '8px 16px', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>← Back</button>
            <div style={{ background: dark3, border: `1px solid ${border}`, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#eee' }}>{selectedService.name} · <span style={{ color: gold }}>${ selectedService.price}</span></div>
              <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{formatDateShort(selectedDate)}</div>
            </div>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: gold, letterSpacing: '.3em', marginBottom: 16, textTransform: 'uppercase' }}>Pick a Time</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {getTimeSlots().map((t, i) => (
                <button key={i} onClick={() => setSelectedTime(t)}
                  style={{ padding: '14px 8px', background: dark2, border: `1px solid ${border}`, color: '#eee', cursor: 'pointer', fontSize: 13, textAlign: 'center' }}>
                  {t}
                </button>
              ))}
            </div>
            {getTimeSlots().length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: muted, fontSize: 13 }}>No available slots for this date.</div>
            )}
          </div>
        )}

        {/* STEP 4: CLIENT INFO */}
        {selectedService && selectedDate && selectedTime && !booked && (
          <div style={{ paddingTop: 28 }}>
            <button onClick={() => setSelectedTime(null)} style={{ background: 'none', border: `1px solid ${border}`, color: muted, padding: '8px 16px', fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 20 }}>← Back</button>
            <div style={{ background: dark3, border: `1px solid ${border}`, padding: '16px 18px', marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#eee' }}>{selectedService.name} · <span style={{ color: gold }}>${ selectedService.price}</span></div>
              <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>{formatDateShort(selectedDate)} at {selectedTime}</div>
            </div>
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
              <button onClick={handleBook} disabled={submitting || !clientName.trim() || !clientPhone.trim()}
                style={{ padding: '16px', background: gold, border: 'none', color: dark, fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', fontFamily: 'Cinzel, serif', cursor: 'pointer', marginTop: 8, opacity: submitting || !clientName.trim() || !clientPhone.trim() ? 0.5 : 1 }}>
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
