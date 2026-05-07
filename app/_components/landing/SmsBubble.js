export function SmsBubble({ side = 'in', children, status, style = {} }) {
  const isIn = side === 'in'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isIn ? 'flex-start' : 'flex-end', ...style }}>
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          fontSize: 14,
          lineHeight: 1.4,
          borderRadius: 18,
          borderBottomLeftRadius: isIn ? 6 : 18,
          borderBottomRightRadius: isIn ? 18 : 6,
          background: isIn ? 'var(--ink-3)' : 'var(--brand)',
          color: isIn ? 'var(--ink-6)' : '#fff',
          fontWeight: isIn ? 400 : 500,
        }}
      >
        {children}
      </div>
      {status && !isIn && (
        <span style={{ fontSize: 10, color: 'var(--ink-4)', marginTop: 2, marginRight: 4 }}>{status}</span>
      )}
    </div>
  )
}

export function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div
        style={{
          padding: '10px 14px',
          background: 'var(--ink-3)',
          borderRadius: 18,
          borderBottomLeftRadius: 6,
          display: 'flex',
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--ink-5)',
              opacity: 0.4,
              animation: `sm-typing 1.2s infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes sm-typing {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  )
}

export function ConfirmationCard() {
  return (
    <div
      style={{
        margin: '4px 16px',
        background: 'var(--ink-2)',
        border: '1px solid var(--ink-3)',
        borderRadius: 12,
        padding: 12,
        fontSize: 12,
        color: 'var(--ink-6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: 'var(--brand)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          L
        </span>
        <strong style={{ fontSize: 12 }}>Leed Barber Shop</strong>
      </div>
      <div style={{ color: 'var(--ink-5)', marginBottom: 10, lineHeight: 1.4 }}>
        Saturday May 11 · 2:00 PM<br />
        Fade w/ Lee · $35
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--brand)' }}>
        <span>Reschedule</span>
        <span style={{ color: 'var(--ink-4)' }}>·</span>
        <span>Cancel</span>
        <span style={{ color: 'var(--ink-4)' }}>·</span>
        <span>Add to calendar</span>
      </div>
    </div>
  )
}
