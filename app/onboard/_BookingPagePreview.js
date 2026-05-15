'use client'
import { getTemplate } from '../../lib/templates'

const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

function formatTime12(t) {
  if (!t || typeof t !== 'string' || !t.includes(':')) return ''
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10) || 0
  const period = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${m.toString().padStart(2, '0')} ${period}`
}

function summarizeHours(businessHours) {
  if (!Array.isArray(businessHours) || businessHours.length === 0) return null
  const open = businessHours.filter(h => !h.closed)
  if (open.length === 0) return 'Closed all week'
  if (open.length === 7) return `Daily ${formatTime12(open[0].open)}–${formatTime12(open[0].close)}`
  // Compact: list days with their hours, grouped if identical
  return open
    .map(h => `${DAY_LABELS[h.day] || h.day} ${formatTime12(h.open)}–${formatTime12(h.close)}`)
    .join(' · ')
}

export default function BookingPagePreview({
  templateId,
  shopName,
  salonType,
  tagline,
  about,
  heroImageUrl,
  services = [],
  businessHours,
  instagram,
  city,
  state,
}) {
  const tpl = getTemplate(templateId)
  const c = tpl.colors
  const dec = tpl.decoration || {}
  const displayFont = `'${tpl.fonts.display}', ${tpl.fonts.displayFallback || 'serif'}`
  const uiFont = `'${tpl.fonts.ui}', ${tpl.fonts.uiFallback || 'sans-serif'}`
  const tracking = tpl.style?.letterSpacingDisplay || '.18em'
  const isUpper = tpl.style?.uppercase !== false
  const radius = tpl.style?.buttonRadius || 0

  const heroSvcs = services.filter(s => s.name?.trim()).slice(0, 3)
  const hoursLine = summarizeHours(businessHours)
  const displayName = shopName?.trim() || 'Your Shop'
  const where = [city, state].filter(Boolean).join(', ')
  const igHandle = (instagram || '')
    .trim()
    .replace(/^@/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, '')
    .replace(/^instagram\.com\//, '')
    .split(/[/?#]/)[0]

  // Use the uploaded photo if present, else fall back to template's gradient/scene.
  const heroBg = heroImageUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.55)), url(${heroImageUrl}) center/cover no-repeat`
    : (dec.bgGradient || c.bg)
  const heroTextColor = heroImageUrl ? '#ffffff' : c.text

  return (
    <div style={{
      border: '1px solid var(--gold)',
      background: c.bg,
      borderRadius: 4,
      overflow: 'hidden',
      maxWidth: 360,
      marginInline: 'auto',
      fontFamily: uiFont,
      color: c.text,
    }}>
      {/* Preview chrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: 'var(--dark-3)',
        borderBottom: '1px solid var(--border-dim)',
        color: 'var(--gold)',
        fontSize: 9,
        letterSpacing: '.25em',
        textTransform: 'uppercase',
        fontFamily: 'inherit',
      }}>
        <span>Live Preview</span>
        <span style={{ color: 'var(--muted)' }}>servicemind.io/book/···</span>
      </div>

      {/* Hero */}
      <div style={{
        background: heroBg,
        padding: '28px 20px 24px',
        color: heroTextColor,
        position: 'relative',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        <div style={{
          fontSize: 8,
          letterSpacing: '.3em',
          textTransform: 'uppercase',
          color: heroImageUrl ? 'rgba(255,255,255,0.85)' : c.accent,
          fontWeight: 600,
          marginBottom: 8,
        }}>
          {salonType ? `${salonType} · ` : ''}{where || 'Your City'}
        </div>
        <div style={{
          fontFamily: displayFont,
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: tracking,
          textTransform: isUpper ? 'uppercase' : 'none',
          lineHeight: 1.05,
          marginBottom: tagline ? 10 : 0,
        }}>
          {displayName}
        </div>
        {tagline && (
          <div style={{
            fontSize: 13,
            lineHeight: 1.5,
            fontStyle: 'italic',
            color: heroImageUrl ? 'rgba(255,255,255,0.92)' : c.muted,
            maxWidth: '90%',
          }}>
            {tagline}
          </div>
        )}
        {igHandle && (
          <div style={{
            display: 'inline-block',
            marginTop: 12,
            fontSize: 9,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: heroImageUrl ? 'rgba(255,255,255,0.9)' : c.accent,
          }}>
            @{igHandle} on Instagram
          </div>
        )}
      </div>

      {/* About */}
      {about && (
        <div style={{ padding: '18px 20px 10px', background: c.bg }}>
          <div style={{
            fontSize: 9,
            letterSpacing: '.25em',
            textTransform: 'uppercase',
            color: c.accent,
            marginBottom: 8,
            fontWeight: 600,
          }}>
            About
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: c.text }}>
            {about}
          </div>
        </div>
      )}

      {/* Services */}
      <div style={{ padding: '14px 20px 18px', background: c.bg }}>
        <div style={{
          fontSize: 9,
          letterSpacing: '.25em',
          textTransform: 'uppercase',
          color: c.accent,
          marginBottom: 10,
          fontWeight: 600,
        }}>
          Services
        </div>
        {heroSvcs.length === 0 ? (
          <div style={{ fontSize: 11, color: c.muted, fontStyle: 'italic' }}>
            Your services will show here.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {heroSvcs.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: c.surface,
                border: `1px solid ${c.border}`,
                padding: '8px 12px',
                fontSize: 12,
              }}>
                <span>{s.name}</span>
                {s.price ? (
                  <span style={{ color: c.accent, fontWeight: 600 }}>${s.price}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hours */}
      {hoursLine && (
        <div style={{
          padding: '12px 20px 18px',
          background: c.surface2 || c.surface,
          borderTop: `1px solid ${c.border}`,
        }}>
          <div style={{
            fontSize: 9,
            letterSpacing: '.25em',
            textTransform: 'uppercase',
            color: c.accent,
            marginBottom: 6,
            fontWeight: 600,
          }}>
            Hours
          </div>
          <div style={{ fontSize: 11, color: c.muted, lineHeight: 1.5 }}>
            {hoursLine}
          </div>
        </div>
      )}

      {/* Faux CTA */}
      <div style={{ padding: '0 20px 20px', background: c.surface2 || c.surface }}>
        <div style={{
          background: c.accent,
          color: c.accentInk,
          fontSize: 11,
          padding: '10px 14px',
          textAlign: 'center',
          fontWeight: 700,
          letterSpacing: '.2em',
          textTransform: 'uppercase',
          borderRadius: radius,
        }}>
          Book Now
        </div>
      </div>
    </div>
  )
}
