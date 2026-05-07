export default function DashboardMockup({ width = '100%' }) {
  return (
    <div
      style={{
        width,
        aspectRatio: '16 / 10',
        background: 'var(--ink-1)',
        border: '1px solid var(--ink-3)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Browser chrome */}
      <div
        style={{
          height: 28,
          background: 'var(--ink-2)',
          borderBottom: '1px solid var(--ink-3)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 12px',
          flexShrink: 0,
        }}
      >
        {['#FF5F56', '#FFBD2E', '#27C93F'].map((c) => (
          <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
        ))}
        <div
          style={{
            marginLeft: 14,
            fontSize: 10,
            color: 'var(--ink-4)',
            background: 'var(--ink-1)',
            padding: '3px 10px',
            borderRadius: 4,
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          servicemind.io/dashboard
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 56,
            background: 'var(--ink-1)',
            borderRight: '1px solid var(--ink-3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '14px 0',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {['●', '◉', '○', '○', '○'].map((dot, i) => (
            <span
              key={i}
              style={{
                fontSize: 14,
                color: i === 0 ? 'var(--brand)' : 'var(--ink-4)',
              }}
            >
              {dot}
            </span>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-6)' }}>Today · Saturday</div>
            <div style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600 }}>+ New booking</div>
          </div>
          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { l: 'Today', v: '12' },
              { l: 'Clients', v: '847' },
              { l: 'Avg rating', v: '4.9' },
              { l: 'Revenue', v: '$2.1k' },
            ].map((s) => (
              <div key={s.l} style={{ background: 'var(--ink-2)', border: '1px solid var(--ink-3)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
                <div style={{ fontSize: 16, color: 'var(--ink-6)', fontWeight: 600, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
          {/* Schedule rows */}
          <div style={{ flex: 1, background: 'var(--ink-2)', borderRadius: 8, border: '1px solid var(--ink-3)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {[
              { t: '9:00 AM', n: 'Marcus', s: 'Fade', c: 'var(--ok)' },
              { t: '10:00', n: 'Devon', s: 'Cut & beard', c: 'var(--ok)' },
              { t: '11:00', n: 'Open', s: '—', c: 'var(--ink-4)', muted: true },
              { t: '12:30 PM', n: 'Tariq', s: 'Beard line-up', c: 'var(--brand)' },
              { t: '2:00 PM', n: 'Lee (you)', s: 'Lunch', c: 'var(--ink-4)', muted: true },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  borderBottom: i < 4 ? '1px solid var(--ink-3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 11,
                  opacity: r.muted ? 0.6 : 1,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.c, flexShrink: 0 }} />
                <span style={{ color: 'var(--ink-5)', minWidth: 60 }}>{r.t}</span>
                <span style={{ color: 'var(--ink-6)', fontWeight: 500, flex: 1 }}>{r.n}</span>
                <span style={{ color: 'var(--ink-4)' }}>{r.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
