'use client'

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

const buildHours = (opensByDay) =>
  DAYS.map(({ key }) => {
    const o = opensByDay[key]
    return o
      ? { day: key, open: o[0], close: o[1], closed: false }
      : { day: key, open: '09:00', close: '17:00', closed: true }
  })

export const DEFAULT_BUSINESS_HOURS = buildHours({
  mon: ['09:00', '19:00'],
  tue: ['09:00', '19:00'],
  wed: ['09:00', '19:00'],
  thu: ['09:00', '19:00'],
  fri: ['09:00', '19:00'],
  sat: ['09:00', '17:00'],
})

const PRESETS = [
  {
    id: 'standard',
    label: 'Standard salon',
    sub: 'M–F 9–7, Sat 9–5, Sun closed',
    hours: DEFAULT_BUSINESS_HOURS,
  },
  {
    id: 'barber',
    label: 'Barber traditional',
    sub: 'T–F 10–7, Sat 9–4, Sun–Mon closed',
    hours: buildHours({
      tue: ['10:00', '19:00'],
      wed: ['10:00', '19:00'],
      thu: ['10:00', '19:00'],
      fri: ['10:00', '19:00'],
      sat: ['09:00', '16:00'],
    }),
  },
  {
    id: 'all_week',
    label: '7 days',
    sub: 'Daily 9–6',
    hours: buildHours({
      mon: ['09:00', '18:00'],
      tue: ['09:00', '18:00'],
      wed: ['09:00', '18:00'],
      thu: ['09:00', '18:00'],
      fri: ['09:00', '18:00'],
      sat: ['09:00', '18:00'],
      sun: ['09:00', '18:00'],
    }),
  },
]

function presetMatches(hours, preset) {
  return DAYS.every(({ key }, i) => {
    const a = hours[i]
    const b = preset.hours[i]
    if (a.closed && b.closed) return true
    if (a.closed !== b.closed) return false
    return a.open === b.open && a.close === b.close
  })
}

export default function BusinessHoursPicker({ value, onChange }) {
  const hours = value && value.length === 7 ? value : DEFAULT_BUSINESS_HOURS
  const activePresetId = PRESETS.find(p => presetMatches(hours, p))?.id || null

  const update = (idx, patch) => {
    const next = hours.map((h, i) => (i === idx ? { ...h, ...patch } : h))
    onChange(next)
  }

  return (
    <div>
      {/* Preset chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {PRESETS.map(p => {
          const active = activePresetId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.hours)}
              style={{
                background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border-dim)'}`,
                color: active ? 'var(--gold)' : 'var(--muted)',
                padding: '8px 14px',
                fontSize: 11,
                lineHeight: 1.3,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>{p.label}</div>
              <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{p.sub}</div>
            </button>
          )
        })}
      </div>

      {/* Day grid */}
      <div style={{ border: '1px solid var(--border-dim)', background: 'var(--dark-3)' }}>
        {DAYS.map(({ key, label }, i) => {
          const h = hours[i]
          return (
            <div
              key={key}
              style={{
                display: 'grid',
                gridTemplateColumns: '54px 1fr 1fr 76px',
                gap: 8,
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: i < DAYS.length - 1 ? '1px solid var(--border-dim)' : 'none',
                opacity: h.closed ? 0.55 : 1,
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 500 }}>
                {label}
              </div>
              <input
                type="time"
                className="input"
                value={h.open}
                disabled={h.closed}
                onChange={e => update(i, { open: e.target.value })}
                style={{ padding: '8px 10px', fontSize: 12 }}
              />
              <input
                type="time"
                className="input"
                value={h.close}
                disabled={h.closed}
                onChange={e => update(i, { close: e.target.value })}
                style={{ padding: '8px 10px', fontSize: 12 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={e => update(i, { closed: e.target.checked })}
                  style={{ accentColor: 'var(--gold)' }}
                />
                Closed
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
