import PhoneFrame from './PhoneFrame'
import { SmsBubble } from './SmsBubble'

export default function ReminderThreadMockup({ width = 280 }) {
  return (
    <PhoneFrame width={width}>
      <div style={{ padding: '8px 16px 10px', borderBottom: '1px solid var(--ink-3)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>L</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-6)' }}>Leed Barber Shop</span>
          <span style={{ fontSize: 9, color: 'var(--ink-4)' }}>Today, 3:14 PM</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SmsBubble side="out">
          Reminder: your Fade with Lee is tomorrow at 2pm. Reply C to confirm, R to reschedule, X to cancel.
        </SmsBubble>
        <SmsBubble side="in">R</SmsBubble>
        <SmsBubble side="out" status="delivered">
          Sure — I have Fri 5pm or Sat 11am. Which works?
        </SmsBubble>
        <SmsBubble side="in">sat 11</SmsBubble>
        <SmsBubble side="out">Done. Saturday 11am is locked in. See you then 👍</SmsBubble>
      </div>
    </PhoneFrame>
  )
}
