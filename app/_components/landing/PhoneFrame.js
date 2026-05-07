export default function PhoneFrame({ children, time = '9:41', width = 280, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        width,
        aspectRatio: '9 / 19.5',
        background: 'var(--ink-3)',
        border: '1px solid var(--ink-3)',
        borderRadius: 36,
        padding: 6,
        boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--ink-1)',
          borderRadius: 30,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 22px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink-6)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span>{time}</span>
          {/* Notch / dynamic island */}
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 90,
              height: 22,
              background: 'var(--ink-0)',
              borderRadius: 999,
            }}
          />
          <span style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 10, opacity: 0.85 }}>
            <span>●●●●</span>
            <span>5G</span>
            <span style={{ width: 18, height: 9, border: '1px solid currentColor', borderRadius: 2, padding: 1, marginLeft: 2 }}>
              <span style={{ display: 'block', width: '70%', height: '100%', background: 'currentColor', borderRadius: 1 }} />
            </span>
          </span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>{children}</div>
      </div>
    </div>
  )
}
