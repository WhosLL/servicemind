'use client'
import { useEffect, useRef, useState } from 'react'

const MAX_REROLLS = 5

export default function AiCopyFields({ context, value, onChange }) {
  // value: { tagline: string, about: string }
  // onChange: (next) => void — fires on every edit AND on AI gen completion
  // context: { shop_name, salon_type, city, state, owner_name, template_id }

  const [generating, setGenerating] = useState(false)
  const [rerollsUsed, setRerollsUsed] = useState(0)
  const [err, setErr] = useState('')
  const [genFailed, setGenFailed] = useState(false)
  const autoFired = useRef(false)

  const callApi = async ({ target, seed }) => {
    setErr('')
    setGenerating(true)
    try {
      const res = await fetch('/api/onboard/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, target, seed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed.')
      const patch = {}
      if (typeof data.tagline === 'string') patch.tagline = data.tagline
      if (typeof data.about === 'string') patch.about = data.about
      if (Object.keys(patch).length === 0) throw new Error('AI returned no copy.')
      onChange({ ...value, ...patch })
      setGenFailed(false)
    } catch (e) {
      setErr(e.message || 'Generation failed.')
      setGenFailed(true)
    } finally {
      setGenerating(false)
    }
  }

  // Auto-fire on mount once we have enough context.
  useEffect(() => {
    if (autoFired.current) return
    if (!context.shop_name || !context.salon_type) return
    autoFired.current = true
    callApi({ target: 'both' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.shop_name, context.salon_type])

  const reroll = (target) => {
    if (rerollsUsed >= MAX_REROLLS) return
    const seed = rerollsUsed + 1
    setRerollsUsed(rerollsUsed + 1)
    callApi({ target, seed })
  }

  const capped = rerollsUsed >= MAX_REROLLS
  const FieldLabel = ({ children }) => (
    <label style={{ fontSize: 10, letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 7 }}>{children}</label>
  )

  const RerollButton = ({ target }) => (
    <button
      type="button"
      onClick={() => reroll(target)}
      disabled={generating || capped}
      style={{
        background: 'none',
        border: '1px solid var(--border-dim)',
        color: capped ? 'var(--muted)' : 'var(--gold)',
        padding: '4px 10px',
        fontSize: 10,
        letterSpacing: '.2em',
        textTransform: 'uppercase',
        cursor: (generating || capped) ? 'not-allowed' : 'pointer',
        opacity: (generating || capped) ? 0.5 : 1,
      }}
    >
      {generating ? 'Working...' : 'Try again'}
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <FieldLabel>Tagline</FieldLabel>
        <input
          className="input"
          placeholder={generating && !value.tagline ? 'Writing your tagline...' : 'A short, punchy line under your shop name'}
          value={value.tagline || ''}
          onChange={e => onChange({ ...value, tagline: e.target.value })}
          maxLength={80}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{(value.tagline || '').length}/80</span>
          <RerollButton target="tagline" />
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>About</FieldLabel>
        <textarea
          className="input"
          placeholder={generating && !value.about ? 'Writing your about section...' : '2-3 sentences. Lead with what the shop does, not adjectives.'}
          value={value.about || ''}
          onChange={e => onChange({ ...value, about: e.target.value })}
          rows={3}
          maxLength={400}
          style={{ resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{(value.about || '').length}/400</span>
          <RerollButton target="about" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--muted)' }}>
        <span>
          {capped
            ? 'Re-roll limit reached — keep editing manually.'
            : genFailed
              ? "Couldn't generate copy — write your own above."
              : `${MAX_REROLLS - rerollsUsed} re-rolls left`}
        </span>
        {err && <span style={{ color: '#ff7070' }}>{err}</span>}
      </div>
    </div>
  )
}
