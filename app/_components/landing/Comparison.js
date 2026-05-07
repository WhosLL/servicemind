'use client'
import { useState } from 'react'

const COLS = [
  { key: 'sm', label: 'ServiceMind', highlight: true },
  { key: 'booksy', label: 'Booksy' },
  { key: 'ghl', label: 'GoHighLevel' },
  { key: 'squire', label: 'Squire' },
  { key: 'mindbody', label: 'Mindbody' },
]

const ROWS = [
  { label: 'Price', sm: '$49/mo flat', booksy: '~$60–100 effective', ghl: '$97–$497/mo', squire: '$30–$120/chair', mindbody: '$139–$259/mo+', highlightSm: true },
  { label: 'Booking fees', sm: 'None', booksy: '~$1.50–$3.50 / booking', ghl: 'DIY', squire: 'On add-ons', mindbody: 'On add-ons', flag: ['booksy'] },
  { label: 'SMS confirmations included', sm: true, booksy: 'Add-on', ghl: 'BYO Twilio', squire: true, mindbody: 'Add-on' },
  { label: 'AI receptionist', sm: true, booksy: false, ghl: 'Build it yourself', squire: false, mindbody: false },
  { label: 'In-thread reschedule (no portal)', sm: true, booksy: false, ghl: false, squire: false, mindbody: false, highlightSm: true },
  { label: 'Custom branded booking page', sm: '10 templates', booksy: 'Generic listing', ghl: 'You build it', squire: true, mindbody: 'Clunky' },
  { label: 'Setup time', sm: '~5 minutes', booksy: '~30 min', ghl: 'Days–weeks', squire: '~1 hr + onboarding', mindbody: 'Days + fee', flag: ['ghl', 'mindbody'] },
]

function Cell({ value, isSm, flagged }) {
  const muted = !isSm
  if (value === true) {
    return (
      <span style={{ color: 'var(--ok)', fontWeight: 600, fontSize: 16 }}>
        ✓
      </span>
    )
  }
  if (value === false) {
    return <span style={{ color: 'var(--ink-4)', fontSize: 16 }}>×</span>
  }
  return (
    <span
      style={{
        fontSize: 14,
        color: isSm ? 'var(--ink-0)' : muted ? 'var(--ink-2)' : 'var(--ink-5)',
        fontWeight: isSm ? 600 : 400,
        background: flagged ? 'var(--warn-dim)' : 'transparent',
        padding: flagged ? '2px 8px' : 0,
        borderRadius: flagged ? 4 : 0,
      }}
    >
      {value}
    </span>
  )
}

export default function Comparison() {
  const [open, setOpen] = useState(-1)

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="cmp-desktop" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: 'var(--ink-4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}></th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'center',
                    background: c.highlight ? 'var(--brand-tint)' : 'transparent',
                    borderLeft: c.highlight ? '1px solid var(--brand)' : 'none',
                    borderRight: c.highlight ? '1px solid var(--brand)' : 'none',
                    borderTop: c.highlight ? '1px solid var(--brand)' : 'none',
                    fontSize: 14,
                    color: c.highlight ? 'var(--brand)' : 'var(--ink-2)',
                    fontWeight: 600,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <tr key={i} style={{ borderTop: '1px solid #E2E5EA' }}>
                <td style={{ padding: '14px 16px', fontSize: 14, color: 'var(--ink-2)', fontWeight: 500, background: '#fff' }}>{r.label}</td>
                {COLS.map((c) => {
                  const isSm = c.key === 'sm'
                  const flagged = !isSm && r.flag?.includes(c.key)
                  return (
                    <td
                      key={c.key}
                      style={{
                        padding: '14px 16px',
                        textAlign: 'center',
                        background: isSm ? 'var(--brand-tint)' : '#fff',
                        borderLeft: isSm ? '1px solid var(--brand)' : 'none',
                        borderRight: isSm ? '1px solid var(--brand)' : 'none',
                        borderBottom: isSm && i === ROWS.length - 1 ? '1px solid var(--brand)' : 'none',
                      }}
                    >
                      <Cell value={r[c.key]} isSm={isSm} flagged={flagged} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile two-tier */}
      <div className="cmp-mobile">
        <div
          style={{
            background: 'var(--brand-tint)',
            border: '2px solid var(--brand)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--brand)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, fontFamily: 'var(--font-geist-mono), monospace' }}>
            ServiceMind
          </div>
          {ROWS.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,90,31,0.18)' : 'none', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{r.label}</span>
              <span style={{ fontSize: 14, color: 'var(--ink-0)', fontWeight: 600, textAlign: 'right' }}>
                {r.sm === true ? '✓' : r.sm === false ? '×' : r.sm}
              </span>
            </div>
          ))}
        </div>
        {COLS.filter((c) => !c.highlight).map((c, ci) => {
          const isOpen = open === ci
          return (
            <div key={c.key} style={{ marginBottom: 8, border: '1px solid #E2E5EA', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : ci)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ink-2)',
                  fontFamily: 'inherit',
                }}
              >
                <span>vs {c.label}</span>
                <span style={{ color: 'var(--brand)', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 200ms', fontSize: 18, lineHeight: 1 }}>+</span>
              </button>
              <div style={{ maxHeight: isOpen ? 400 : 0, overflow: 'hidden', transition: 'max-height 220ms ease' }}>
                <div style={{ padding: '0 16px 14px' }}>
                  {ROWS.map((r, i) => {
                    const flagged = r.flag?.includes(c.key)
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: i > 0 ? '1px solid #EEE' : 'none', gap: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>{r.label}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', color: flagged ? 'var(--warn)' : 'var(--ink-2)', background: flagged ? 'var(--warn-dim)' : 'transparent', padding: flagged ? '2px 8px' : 0, borderRadius: flagged ? 4 : 0 }}>
                          {r[c.key] === true ? '✓' : r[c.key] === false ? '×' : r[c.key]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <style>{`
        .cmp-desktop { display: block; }
        .cmp-mobile { display: none; }
        @media (max-width: 768px) {
          .cmp-desktop { display: none; }
          .cmp-mobile { display: block; }
        }
      `}</style>
    </>
  )
}
