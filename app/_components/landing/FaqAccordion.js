'use client'
import { useState } from 'react'

export default function FaqAccordion({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {items.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={i} style={{ borderTop: i === 0 ? '1px solid var(--ink-3)' : 'none', borderBottom: '1px solid var(--ink-3)' }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '24px 0',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: 'var(--ink-6)',
                fontFamily: 'inherit',
                fontSize: 17,
                fontWeight: 500,
                gap: 16,
              }}
            >
              <span>{item.q}</span>
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand)',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                  fontSize: 22,
                  fontWeight: 300,
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </button>
            <div
              style={{
                maxHeight: isOpen ? 400 : 0,
                overflow: 'hidden',
                transition: 'max-height 220ms ease',
              }}
            >
              <div
                style={{
                  paddingBottom: 24,
                  color: 'var(--ink-5)',
                  fontSize: 15,
                  lineHeight: 1.65,
                  opacity: isOpen ? 1 : 0,
                  transition: 'opacity 180ms ease 80ms',
                }}
              >
                {item.a}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
