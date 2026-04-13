'use client'
import { useState, useEffect } from 'react'
import { sb } from '../../../lib/supabase'
import '../../globals.css'

const DAYS = ['sun','mon','tue','wed','thu','fri','sat']

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

function getSlots(dayHours) {
  if (!dayHours) return []
  const open = timeToMins(dayHours.open)
  const close = timeToMins(dayHours.close)
  const slots = []
  for (let t = open; t + 30 <= close; t += 30) slots.push(minsToTime(t))
  return slots
}

function getNext14Days(hours) {
  const days = []
  const today = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dayKey = DAYS[d.getDay()]
    if (hours?.[dayKey]) days.push({ date: d, dayKey, hours: hours[dayKey] })
  }
  return days
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function BookingPage({ params }) {
  const { slug } = params
  const [salon, setSalon] = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    load()
  }, [slug])

  const load = async () => {
    const { data: sData } = await sb().from('salons').select('*').eq('slug', slug).single()
    if (!sData) { setNotFound(true); setLoading(false); return }
    setSalon(sData)
    const { data: svData } = await sb().from('salon_services').select('*').eq('salon_id', sData.id).eq('is_active', true).order('sort_order')
    setServices(svData || [])
    setLoading(false)
  }

  const submit = async () => {
    if (!name.trim() || !phone.trim()) { setErr('Please enter your name and phone number.'); return }
    setSubmitting(true); setErr('')
    const dateStr = selectedDay.date.toISOString().split('T')[0]
    await sb().from('salon_appointments').insert([{
      salon_id: salon.id,
      client_name: name.trim(),
      client_phone: phone.trim(),
      service_id: selectedService.id,
      service_name: selectedService.name,
      total_price: selectedService.price,
      appointment_date: dateStr,
      appointment_time: selectedTime,
      notes: notes.trim() || null,
      status: 'confirmed'
    }])
    setConfirmed(true)
    setSubmitting(false)
  }

  const categories = [...new Set(services.map(s => s.category))].filter(Boolean)
  const availableDays = salon ? getNext14Days(salon.hours) : []
  const slots = selectedDay ? getSlots(selectedDay.hours) : []

  const gold = 'var(--gold)'
  const S = {
    page: { minHeight: '100vh', background: '#080808', color: 'var(--text)' },
    header: { borderBottom: '1px solid var(--border-dim)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    container: { maxWidth: 680, margin: '0 auto', padding: '40px 24px' },
    card: { background: 'var(--dark)', border: '1px solid var(--border-dim)', padding: 24, marginBottom: 12 },
    label: { fontSize: 9, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6, display: 'block' },
  }

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.2em', textTransform: 'uppercase' }}>Loading...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
        <div className="cinzel" style={{ color: gold, fontSize: 13, letterSpacing: '.3em', marginBottom: 12 }}>Not Found</div>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>This booking page doesn't exist.</p>
      </div>
    </div>
  )

  if (confirmed) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 460, padding: '0 24px' }}>
        <div style={{ fontSize: 56, color: gold, marginBottom: 24 }}>✓</div>
        <div className="cinzel" style={{ color: gold, fontSize: 12, letterSpacing: '.3em', marginBottom: 16 }}>Booking Confirmed</div>
        <h2 className="cormorant" style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.1, marginBottom: 20 }}>
          See you soon,<br /><em style={{ color: gold, fontStyle: 'italic' }}>{name}.</em>
        </h2>
        <div style={{ background: 'var(--dark)', border: '1px solid var(--border-dim)', padding: 24, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Service', selectedService.name],
              ['Date', formatDate(selectedDay.date)],
              ['Time', selectedTime],
              ['Location', [salon.address, salon.city, salon.state].filter(Boolean).join(', ') || `${salon.city}, ${salon.state}`],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 400 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          You'll receive a confirmation text at {phone}. We'll remind you 24 hours before your appointment.
        </p>
      </div>
    </div>
  )

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div className="cinzel" style={{ fontSize: 15, letterSpacing: '.3em', color: gold }}>{salon.shop_name}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{salon.city}{salon.state ? `, ${salon.state}` : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {salon.instagram && (
            <a href={`https://instagram.com/${salon.instagram.replace('@','')}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>
              {salon.instagram}
            </a>
          )}
          {salon.phone && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{salon.phone}</span>}
        </div>
      </div>

      <div style={S.container}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 40 }}>
          {['Service', 'Date & Time', 'Your Info'].map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 2, background: i < step ? gold : 'var(--border-dim)', marginBottom: 6, transition: 'background .3s' }} />
              <div style={{ fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: i < step ? gold : 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Choose Service */}
        {step === 1 && (
          <div>
            <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 28 }}>
              Choose your <em style={{ color: gold, fontStyle: 'italic' }}>service.</em>
            </h2>
            {categories.map(cat => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: gold, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                  {cat}
                  <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {services.filter(s => s.category === cat).map(svc => (
                    <button key={svc.id} onClick={() => { setSelectedService(svc); setStep(2) }}
                      style={{ background: selectedService?.id === svc.id ? 'rgba(201,168,76,.08)' : 'var(--dark)', border: `1px solid ${selectedService?.id === svc.id ? gold : 'var(--border-dim)'}`, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all .2s', width: '100%', textAlign: 'left' }}>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{svc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{svc.duration_minutes} min</div>
                      </div>
                      <div className="cormorant" style={{ fontSize: 22, color: gold, fontWeight: 300 }}>${svc.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Pick Date & Time */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', marginBottom: 20, padding: 0, letterSpacing: '.1em' }}>← Back</button>
            <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>
              Pick a <em style={{ color: gold, fontStyle: 'italic' }}>date & time.</em>
            </h2>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
              {selectedService.name} · ${selectedService.price} · {selectedService.duration_minutes} min
            </div>

            <div style={{ marginBottom: 28 }}>
              <span style={S.label}>Available Dates</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {availableDays.map((day, i) => (
                  <button key={i} onClick={() => { setSelectedDay(day); setSelectedTime(null) }}
                    style={{ padding: '10px 16px', border: `1px solid ${selectedDay === day ? gold : 'var(--border-dim)'}`, background: selectedDay === day ? 'rgba(201,168,76,.08)' : 'var(--dark)', color: selectedDay === day ? gold : 'var(--text)', fontSize: 12, cursor: 'pointer', transition: 'all .2s', whiteSpace: 'nowrap' }}>
                    {formatDate(day.date)}
                  </button>
                ))}
              </div>
            </div>

            {selectedDay && (
              <div style={{ marginBottom: 32 }}>
                <span style={S.label}>Available Times</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {slots.map((slot, i) => (
                    <button key={i} onClick={() => setSelectedTime(slot)}
                      style={{ padding: '10px 16px', border: `1px solid ${selectedTime === slot ? gold : 'var(--border-dim)'}`, background: selectedTime === slot ? 'rgba(201,168,76,.08)' : 'var(--dark)', color: selectedTime === slot ? gold : 'var(--text)', fontSize: 12, cursor: 'pointer', transition: 'all .2s' }}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { if (!selectedDay || !selectedTime) { setErr('Please select a date and time.'); return } setErr(''); setStep(3) }}
              disabled={!selectedDay || !selectedTime} className="btn-gold"
              style={{ padding: '16px 40px', opacity: selectedDay && selectedTime ? 1 : .4 }}>
              Continue →
            </button>
            {err && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 12 }}>{err}</div>}
          </div>
        )}

        {/* Step 3: Client Info */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', marginBottom: 20, padding: 0, letterSpacing: '.1em' }}>← Back</button>
            <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>
              Almost <em style={{ color: gold, fontStyle: 'italic' }}>done.</em>
            </h2>

            {/* Summary */}
            <div style={{ background: 'rgba(201,168,76,.04)', border: `1px solid ${gold}`, padding: '16px 20px', marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--muted)' }}>{selectedService.name}</span>
                <span style={{ color: gold }}>${selectedService.price}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(selectedDay.date)} at {selectedTime}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={S.label}>Your Name *</label>
                <input className="input" placeholder="First & last name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Phone Number *</label>
                <input className="input" type="tel" placeholder="(404) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Notes (optional)</label>
                <input className="input" placeholder="Anything we should know?" value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>

            {err && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{err}</div>}

            <button onClick={submit} disabled={submitting} className="btn-gold"
              style={{ width: '100%', textAlign: 'center', padding: '18px', fontSize: 13, opacity: submitting ? .6 : 1 }}>
              {submitting ? 'Booking...' : `Confirm Booking — $${selectedService.price}`}
            </button>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, textAlign: 'center', lineHeight: 1.7 }}>
              You'll receive a confirmation text. No payment required now — pay at the shop.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
