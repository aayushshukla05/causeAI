import { Clock } from 'lucide-react'

export function IncidentTimeline({ events }) {
  if (!events?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.65s ease forwards' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Clock size={16} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>INCIDENT TIMELINE</span>
      </div>
      <div style={{ padding: '20px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 32, top: 20, bottom: 20, width: 1, background: 'var(--border)' }} />
        {events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < events.length - 1 ? 20 : 0, position: 'relative' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-card)', border: `2px solid ${i === 0 ? 'var(--red)' : i === events.length - 1 ? 'var(--green)' : 'var(--border-bright)'}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--red)' : i === events.length - 1 ? 'var(--green)' : 'var(--border-bright)' }} />
            </div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              {ev.time && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{ev.time}</div>}
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{ev.event || ev.description || String(ev)}</div>
              {ev.service && <div style={{ fontSize: 12, color: 'var(--accent-dim)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{ev.service}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
