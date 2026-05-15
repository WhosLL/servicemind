'use client'
import { useEffect, useRef, useState } from 'react'
import { getTemplate } from '../../lib/templates'

const MAX_REROLLS = 5

export default function ColorwayControls({ templateId, photoColors, overrides, onChange }) {
  // photoColors: hex[] | null   — null = no photo yet, hide.
  // overrides:   { accent?, accentSecondary? } | null
  // onChange:    (overrides | null) => void
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [rerollsUsed, setRerollsUsed] = useState(0)
  const lastSourceColorsRef = useRef(null)

  const tpl = getTemplate(templateId)
  const baseColors = tpl.colors
  const effectiveColors = { ...baseColors, ...(overrides || {}) }

  const callBlend = async (seed) => {
    if (!photoColors || photoColors.length === 0) return
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/onboard/colorway-blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, photo_colors: photoColors, seed }),
      })
      const data = await res.json()
      if (!res.ok || !data.overrides) {
        throw new Error(data.error || 'Blend failed.')
      }
      onChange(data.overrides)
    } catch (e) {
      // Spec: silent fall back on failure — but we surface a small err inline
      // so the owner knows why the colors didn't change.
      setErr(e.message || 'Blend failed.')
    } finally {
      setBusy(false)
    }
  }

  // Auto-fire on first photo + template combo (or when either changes).
  useEffect(() => {
    if (!photoColors || photoColors.length === 0) return
    const signature = `${templateId}::${photoColors.join(',')}`
    if (lastSourceColorsRef.current === signature) return
    lastSourceColorsRef.current = signature
    setRerollsUsed(0)
    callBlend(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, photoColors?.join(',')])

  if (!photoColors || photoColors.length === 0) return null

  const capped = rerollsUsed >= MAX_REROLLS
  const reroll = () => {
    if (capped || busy) return
    const next = rerollsUsed + 1
    setRerollsUsed(next)
    callBlend(next)
  }
  const reset = () => {
    onChange(null)
    setErr('')
  }

  const chipKeys = ['accent', 'accentSecondary', 'bg', 'surface', 'text', 'border']

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Booking Page Colorway
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={reroll}
            disabled={busy || capped}
            style={{
              background: 'none',
              border: '1px solid var(--border-dim)',
              color: capped ? 'var(--muted)' : 'var(--gold)',
              padding: '4px 10px',
              fontSize: 10,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              cursor: (busy || capped) ? 'not-allowed' : 'pointer',
              opacity: (busy || capped) ? 0.5 : 1,
            }}
          >
            {busy ? 'Blending...' : 'Try again'}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={busy || !overrides}
            style={{
              background: 'none',
              border: '1px solid var(--border-dim)',
              color: 'var(--muted)',
              padding: '4px 10px',
              fontSize: 10,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              cursor: (busy || !overrides) ? 'not-allowed' : 'pointer',
              opacity: (busy || !overrides) ? 0.4 : 1,
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Palette chips */}
      <div style={{
        display: 'flex',
        gap: 2,
        border: '1px solid var(--border-dim)',
        background: 'var(--dark-3)',
        padding: 4,
      }}>
        {chipKeys.map(k => {
          const v = effectiveColors[k]
          const isOverridden = overrides && overrides[k] && overrides[k] !== baseColors[k]
          return (
            <div
              key={k}
              title={`${k}: ${v}${isOverridden ? ' (from photo)' : ''}`}
              style={{
                flex: 1,
                aspectRatio: '1 / 0.5',
                background: v,
                borderRadius: 2,
                position: 'relative',
              }}
            >
              {isOverridden && (
                <div style={{
                  position: 'absolute',
                  top: 2,
                  right: 3,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  boxShadow: '0 0 0 1px var(--dark-3)',
                }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 10, color: 'var(--muted)' }}>
        <span>
          {capped
            ? 'Re-roll limit reached.'
            : overrides
              ? `${MAX_REROLLS - rerollsUsed} re-rolls left · gold dot = pulled from photo`
              : 'Pure template palette'}
        </span>
        {err && <span style={{ color: '#ff7070' }}>{err}</span>}
      </div>
    </div>
  )
}
