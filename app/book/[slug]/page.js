'use client'
import { useState, useEffect, useCallback } from 'react'
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

function formatDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isOpen(date, hours) {
  if (!hours) return false
  const dayKey = DAYS[date.getDay()]
  return !!hours?.[dayKey]
}

function getDayHours(date, hours) {
  const dayKey = DAYS[date.getDay()]
  return hours?.[dayKey] || null
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
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
  const [selectedAddons, setSelectedAddons] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [booking, setBooking] = useState(null)
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
    try {
      const dateStr = new Date(selectedDay.date.getFullYear(), selectedDay.date.getMonth(), selectedDay.date.getDate()).toISOString().split('T')[0]
      const totalPrice = Number(selectedService.price) + selectedAddons.reduce((s, a) => s + Number(a.price), 0)
      const { error } = await sb().from('salon_appointments').insert([{
        salon_id: salon.id,
        client_name: name.trim(),
        client_phone: phone.trim(),
        service_id: selectedService.id,
        service_name: selectedAddons.length > 0 ? `${selectedService.name} + ${selectedAddons.map(a => a.name).join(', ')}` : selectedService.name,
        total_price: totalPrice,
        appointment_date: dateStr,
        appointment_time: selectedTime,
        notes: notes.trim() || null,
        status: 'confirmed'
      }])
      if (error) throw error
      setBooking({
        serviceName: selectedAddons.length > 0 ? `${selectedService.name} + ${selectedAddons.map(a => a.name).join(', ')}` : selectedService.name,
        total: Number(selectedService.price) + selectedAddons.reduce((s, a) => s + Number(a.price), 0),
        date: formatDate(selectedDay.date),
        time: selectedTime,
        clientName: name.trim(),
        clientPhone: phone.trim(),
        location: [salon.address, salon.city, salon.state].filter(Boolean).join(', ') || `${salon.city}, ${salon.state}`,
        shopName: salon.shop_name,
      })
      setConfirmed(true)
    } catch (e) {
      setErr('Booking failed — please try again. (' + (e?.message || 'Unknown error') + ')')
    }
    setSubmitting(false)
  }

  const mainServices = services.filter(s => !s.is_addon)
  const addonServices = services.filter(s => s.is_addon)
  const mainCategories = [...new Set(mainServices.map(s => s.category))].filter(Boolean)
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

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

  if (confirmed && booking) return (
    <div style={{ minHeight: '100vh', background: '#080808', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 460, padding: '0 24px' }}>
        <div style={{ fontSize: 56, color: 'var(--gold)', marginBottom: 24 }}>✓</div>
        <div className="cinzel" style={{ color: 'var(--gold)', fontSize: 12, letterSpacing: '.3em', marginBottom: 16 }}>Booking Confirmed</div>
        <h2 className="cormorant" style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.1, marginBottom: 20 }}>
          See you soon,<br /><em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{booking.clientName}.</em>
        </h2>
        <div style={{ background: 'var(--dark)', border: '1px solid var(--border-dim)', padding: 24, marginBottom: 24, textAlign: 'left' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Shop', booking.shopName],
              ['Service', booking.serviceName],
              ['Total', `$${booking.total}`],
              ['Date', booking.date],
              ['Time', booking.time],
              ['Location', booking.location],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 400 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          We'll send a reminder 24 hours before your appointment.
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
          {['Service', 'Add-Ons', 'Date & Time', 'Your Info'].map((label, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ height: 2, background: (i === 0 && step >= 1) || (i === 1 && step >= 1.5) || (i === 2 && step >= 2) || (i === 3 && step >= 3) ? gold : 'var(--border-dim)', marginBottom: 6, transition: 'background .3s' }} />
              <div style={{ fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: (i === 0 && step >= 1) || (i === 1 && step >= 1.5) || (i === 2 && step >= 2) || (i === 3 && step >= 3) ? gold : 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Step 1: Choose Service */}
        {step === 1 && (
          <div>
            <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 28 }}>
              Choose your <em style={{ color: gold, fontStyle: 'italic' }}>service.</em>
            </h2>
            {mainCategories.map(cat => (
              <div key={cat} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 9, letterSpacing: '.3em', textTransform: 'uppercase', color: gold, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                  {cat}
                  <span style={{ flex: 1, height: 1, background: 'var(--border-dim)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mainServices.filter(s => s.category === cat).map(svc => (
                    <button key={svc.id} onClick={() => { setSelectedService(svc); setSelectedAddons([]); addonServices.length > 0 ? setStep(1.5) : setStep(2) }}
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

        {/* Step 1.5: Add-Ons */}
        {step === 1.5 && (
          <div>
            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', marginBottom: 20, padding: 0, letterSpacing: '.1em' }}>← Back</button>
            <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>
              Add <em style={{ color: gold, fontStyle: 'italic' }}>extras?</em>
            </h2>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
              {selectedService.name} · ${selectedService.price} · {selectedService.duration_minutes} min
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              {addonServices.map(addon => {
                const checked = selectedAddons.some(a => a.id === addon.id)
                return (
                  <button key={addon.id} onClick={() => setSelectedAddons(prev => checked ? prev.filter(a => a.id !== addon.id) : [...prev, addon])}
                    style={{ background: checked ? 'rgba(201,168,76,.08)' : 'var(--dark)', border: `1px solid ${checked ? gold : 'var(--border-dim)'}`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all .2s', width: '100%', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 18, height: 18, border: `1px solid ${checked ? gold : 'var(--border-dim)'}`, background: checked ? gold : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {checked && <span style={{ color: '#080808', fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)' }}>{addon.name}</div>
                        {addon.duration_minutes > 0 && <div style={{ fontSize: 11, color: 'var(--muted)' }}>+{addon.duration_minutes} min</div>}
                      </div>
                    </div>
                    <div className="cormorant" style={{ fontSize: 20, color: gold, fontWeight: 300 }}>+${addon.price}</div>
                  </button>
                )
              })}
            </div>
            {selectedAddons.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                Total: <span style={{ color: gold }}>${Number(selectedService.price) + selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)}</span>
              </div>
            )}
            <button onClick={() => setStep(2)} className="btn-gold" style={{ padding: '16px 40px' }}>
              {selectedAddons.length > 0 ? `Continue with ${selectedAddons.length} add-on${selectedAddons.length > 1 ? 's' : ''} →` : 'Continue without add-ons →'}
            </button>
          </div>
        )}

        {/* Step 2: Pick Date & Time */}
        {step === 2 && (() => {
          const { firstDay, daysInMonth } = getMonthDays(calYear, calMonth)
          const monthName = new Date(calYear, calMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          const slots = selectedDay ? getSlots(getDayHours(selectedDay.date, salon.hours)) : []
          const canGoPrev = calYear > today.getFullYear() || calMonth > today.getMonth()
          const canGoNext = calYear < today.getFullYear() + 1

          return (
            <div>
              <button onClick={() => addonServices.length > 0 ? setStep(1.5) : setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', marginBottom: 20, padding: 0, letterSpacing: '.1em' }}>← Back</button>
              <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>
                Pick a <em style={{ color: gold, fontStyle: 'italic' }}>date & time.</em>
              </h2>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28 }}>
                {selectedService.name} · ${selectedService.price} · {selectedService.duration_minutes} min
              </div>

              {/* Calendar */}
              <div style={{ border: '1px solid var(--border-dim)', marginBottom: 24 }}>
                {/* Month nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-dim)' }}>
                  <button onClick={() => { if (!canGoPrev) return; if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }}
                    style={{ background: 'none', border: 'none', color: canGoPrev ? 'var(--text)' : 'var(--border-dim)', cursor: canGoPrev ? 'pointer' : 'default', fontSize: 16, padding: '4px 8px' }}>‹</button>
                  <span className="cinzel" style={{ fontSize: 11, letterSpacing: '.2em', color: gold }}>{monthName}</span>
                  <button onClick={() => { if (!canGoNext) return; if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }}
                    style={{ background: 'none', border: 'none', color: canGoNext ? 'var(--text)' : 'var(--border-dim)', cursor: canGoNext ? 'pointer' : 'default', fontSize: 16, padding: '4px 8px' }}>›</button>
                </div>

                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-dim)' }}>
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 9, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)' }}>{d}</div>
                  ))}
                </div>

                {/* Day grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {/* Empty cells before first day */}
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`e${i}`} style={{ padding: '12px 0', borderRight: '1px solid var(--border-dim)', borderBottom: '1px solid var(--border-dim)' }} />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const date = new Date(calYear, calMonth, day)
                    const isPast = date <= today
                    const open = isOpen(date, salon.hours)
                    const isSelected = selectedDay?.date?.toDateString() === date.toDateString()
                    const clickable = !isPast && open

                    return (
                      <button key={day}
                        onClick={() => { if (!clickable) return; setSelectedDay({ date, dayKey: DAYS[date.getDay()], hours: getDayHours(date, salon.hours) }); setSelectedTime(null) }}
                        style={{
                          padding: '12px 0', textAlign: 'center', fontSize: 13,
                          background: isSelected ? gold : 'transparent',
                          color: isSelected ? '#080808' : isPast ? 'var(--border-dim)' : open ? 'var(--text)' : 'var(--border-dim)',
                          border: 'none', borderRight: '1px solid var(--border-dim)', borderBottom: '1px solid var(--border-dim)',
                          cursor: clickable ? 'pointer' : 'default',
                          fontWeight: isSelected ? 600 : 300,
                          position: 'relative',
                        }}>
                        {day}
                        {open && !isPast && !isSelected && (
                          <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: gold }} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDay && (
                <div style={{ marginBottom: 28 }}>
                  <span style={S.label}>Available Times — {formatDate(selectedDay.date)}</span>
                  {slots.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>No times available for this day.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                      {slots.map((slot, i) => (
                        <button key={i} onClick={() => setSelectedTime(slot)}
                          style={{ padding: '11px 8px', border: `1px solid ${selectedTime === slot ? gold : 'var(--border-dim)'}`, background: selectedTime === slot ? gold : 'var(--dark)', color: selectedTime === slot ? '#080808' : 'var(--text)', fontSize: 12, cursor: 'pointer', transition: 'all .15s', textAlign: 'center', fontWeight: selectedTime === slot ? 600 : 300 }}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={() => { if (!selectedDay || !selectedTime) { setErr('Please select a date and time.'); return } setErr(''); setStep(3) }}
                disabled={!selectedDay || !selectedTime} className="btn-gold"
                style={{ padding: '16px 40px', opacity: selectedDay && selectedTime ? 1 : .4 }}>
                Continue →
              </button>
              {err && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 12 }}>{err}</div>}
            </div>
          )
        })()}

        {/* Step 3: Client Info */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', marginBottom: 20, padding: 0, letterSpacing: '.1em' }}>← Back</button>
            <h2 className="cormorant" style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>
              Almost <em style={{ color: gold, fontStyle: 'italic' }}>done.</em>
            </h2>

            {/* Summary */}
            <div style={{ background: 'rgba(201,168,76,.04)', border: `1px solid ${gold}`, padding: '16px 20px', marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--muted)' }}>{selectedService.name}</span>
                <span style={{ color: gold }}>${selectedService.price}</span>
              </div>
              {selectedAddons.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>+ {a.name}</span>
                  <span style={{ color: 'var(--muted)' }}>${a.price}</span>
                </div>
              ))}
              {selectedAddons.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border-dim)', paddingTop: 8, marginTop: 8 }}>
                  <span style={{ color: 'var(--muted)' }}>Total</span>
                  <span style={{ color: gold, fontWeight: 500 }}>${Number(selectedService.price) + selectedAddons.reduce((s, a) => s + Number(a.price), 0)}</span>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{formatDate(selectedDay.date)} at {selectedTime}</div>
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
              {submitting ? 'Booking...' : `Confirm Booking — $${Number(selectedService.price) + selectedAddons.reduce((s, a) => s + Number(a.price), 0)}`}
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
