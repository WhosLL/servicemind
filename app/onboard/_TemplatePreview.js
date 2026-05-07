import { TEMPLATES } from '../../lib/templates'

export default function TemplatePreview({ id, selected = false, onClick }) {
  const tpl = TEMPLATES[id]
  if (!tpl) return null

  const accent = tpl.colors.accent
  const accentInk = tpl.colors.accentInk
  const bg = tpl.colors.bg
  const surface = tpl.colors.surface
  const text = tpl.colors.text
  const muted = tpl.colors.muted
  const border = tpl.colors.border
  const displayFont = `'${tpl.fonts.display}', ${tpl.fonts.displayFallback}`
  const uiFont = `'${tpl.fonts.ui}', ${tpl.fonts.uiFallback}`
  const tracking = tpl.style.letterSpacingDisplay
  const isUpper = tpl.style.uppercase
  const radius = tpl.style.buttonRadius

  return (
    <button
      onClick={onClick}
      style={{
        padding: 0,
        background: 'transparent',
        border: `2px solid ${selected ? 'var(--gold)' : 'var(--border-dim)'}`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all .15s',
        overflow: 'hidden',
        borderRadius: 4,
      }}
    >
      {/* Mini booking-page preview */}
      <div
        style={{
          height: 168,
          background: tpl.decoration?.bgGradient || bg,
          fontFamily: uiFont,
          color: text,
          padding: '14px 14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            fontSize: 7,
            letterSpacing: '.25em',
            color: accent,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {tpl.decoration?.scene || tpl.id} · est 2026
        </div>
        {/* shop name in display font */}
        <div
          style={{
            fontFamily: displayFont,
            fontSize: 16,
            fontWeight: 600,
            color: text,
            letterSpacing: tracking,
            textTransform: isUpper ? 'uppercase' : 'none',
            lineHeight: 1.05,
          }}
        >
          Your Shop
        </div>
        {/* accent rule */}
        <div style={{ width: 32, height: 1, background: accent, opacity: 0.7 }} />
        {/* service rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
          {[
            { name: 'Signature Cut', price: '$35' },
            { name: 'Beard Trim', price: '$20' },
          ].map((s) => (
            <div
              key={s.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: surface,
                border: `1px solid ${border}`,
                padding: '5px 8px',
                fontSize: 9,
                color: text,
              }}
            >
              <span>{s.name}</span>
              <span style={{ color: accent, fontWeight: 600 }}>{s.price}</span>
            </div>
          ))}
          {/* CTA pill */}
          <div
            style={{
              background: accent,
              color: accentInk,
              fontSize: 8,
              padding: '4px 8px',
              textAlign: 'center',
              fontWeight: 700,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              borderRadius: radius || 0,
              marginTop: 2,
            }}
          >
            Book Now →
          </div>
        </div>
      </div>
      {/* Card meta */}
      <div style={{ padding: '12px 14px 14px', background: 'var(--dark-2)' }}>
        <div style={{ fontSize: 12, color: selected ? 'var(--gold)' : 'var(--text)', fontWeight: 500, marginBottom: 4 }}>
          {tpl.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>{tpl.description}</div>
      </div>
    </button>
  )
}
