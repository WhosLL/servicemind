import PhoneFrame from './PhoneFrame'

export default function BookingPageMockup({ width = 280 }) {
  return (
    <PhoneFrame width={width}>
      {/* Hero band */}
      <div
        style={{
          background: 'linear-gradient(180deg, #1a1410 0%, #0f0c08 100%)',
          padding: '20px 16px 16px',
          color: '#e8d8b8',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: '0.25em', color: '#c9a84c', marginBottom: 6 }}>
          BARBERSHOP
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e8d8b8', fontFamily: 'serif' }}>
          Leed Barber Shop
        </div>
        <div style={{ fontSize: 9, color: '#9c8a6a', marginTop: 4 }}>
          Raleigh, NC · Walk-ins welcome
        </div>
      </div>
      {/* Services list */}
      <div style={{ padding: '12px', flex: 1, overflow: 'hidden', background: '#0a0805' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#c9a84c', marginBottom: 8, textTransform: 'uppercase' }}>
          Pick a service
        </div>
        {[
          { name: 'Fade', dur: '30 min', price: '$35' },
          { name: 'Beard line-up', dur: '20 min', price: '$20' },
          { name: 'Cut & beard', dur: '45 min', price: '$50' },
        ].map((s, i) => (
          <div
            key={s.name}
            style={{
              padding: 10,
              border: i === 0 ? '1px solid #c9a84c' : '1px solid #2a2419',
              borderRadius: 6,
              marginBottom: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: i === 0 ? 'rgba(201, 168, 76, 0.06)' : 'transparent',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: '#e8d8b8', fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontSize: 9, color: '#9c8a6a', marginTop: 1 }}>{s.dur}</div>
            </div>
            <div style={{ fontSize: 11, color: '#c9a84c', fontWeight: 600 }}>{s.price}</div>
          </div>
        ))}
        <div
          style={{
            marginTop: 10,
            padding: '10px 16px',
            background: '#c9a84c',
            color: '#0a0805',
            textAlign: 'center',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          Pick a Time →
        </div>
      </div>
    </PhoneFrame>
  )
}
