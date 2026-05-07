'use client'
import { useEffect, useRef, useState } from 'react'
import PhoneFrame from './PhoneFrame'
import { SmsBubble, TypingDots, ConfirmationCard } from './SmsBubble'

const STEPS = [
  { id: 1, type: 'in', body: 'Hey can I get a fade Saturday at 2?', time: '11:42a' },
  { id: 2, type: 'out', body: 'Saturday 2pm with Lee — book it?', status: 'delivered' },
  { id: 3, type: 'in', body: 'yes please' },
  { id: 4, type: 'typing' },
  { id: 5, type: 'out', body: 'Booked. Confirmation below' },
  { id: 6, type: 'card' },
]

export default function HeroSmsMockup({ width = 320 }) {
  const [shown, setShown] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setShown(STEPS.length)
      return
    }

    const el = ref.current
    if (!el) return
    let started = false
    const observer = new IntersectionObserver(
      (entries) => {
        if (started) return
        if (entries.some((e) => e.isIntersecting)) {
          started = true
          let i = 0
          const tick = () => {
            i++
            setShown(i)
            if (i < STEPS.length) {
              const next = STEPS[i]?.type === 'card' ? 600 : next?.type === 'typing' ? 1500 : 700
              setTimeout(tick, STEPS[i - 1]?.type === 'typing' ? 1400 : 700)
            }
          }
          setTimeout(tick, 400)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
      <PhoneFrame width={width}>
        {/* Thread header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 16px 10px',
            borderBottom: '1px solid var(--ink-3)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--brand)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            L
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-6)' }}>Leed Barber Shop</span>
            <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>+1 (555) 0123 · iMessage</span>
          </div>
        </div>

        {/* Bubbles */}
        <div
          style={{
            flex: 1,
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: 'var(--ink-4)',
              textAlign: 'center',
              margin: '0 0 4px',
            }}
          >
            {STEPS[0].time}
          </span>
          {STEPS.map((s, i) => {
            const visible = i < shown
            const fadeStyle = {
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(4px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }
            if (s.type === 'in') {
              return (
                <SmsBubble key={s.id} side="in" style={fadeStyle}>
                  {s.body}
                </SmsBubble>
              )
            }
            if (s.type === 'out') {
              return (
                <SmsBubble key={s.id} side="out" status={s.status} style={fadeStyle}>
                  {s.body}
                </SmsBubble>
              )
            }
            if (s.type === 'typing') {
              return visible && shown <= i + 1 ? (
                <div key={s.id} style={fadeStyle}>
                  <TypingDots />
                </div>
              ) : null
            }
            if (s.type === 'card') {
              return (
                <div key={s.id} style={fadeStyle}>
                  <ConfirmationCard />
                </div>
              )
            }
            return null
          })}
        </div>
      </PhoneFrame>
    </div>
  )
}
