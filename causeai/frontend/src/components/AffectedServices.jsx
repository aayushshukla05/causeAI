import { Server, AlertCircle, CheckCircle, MinusCircle } from 'lucide-react'

const STATUS_ICON = {
  failed: <AlertCircle size={14} color="var(--red)" />,
  down: <AlertCircle size={14} color="var(--red)" />,
  degraded: <MinusCircle size={14} color="var(--yellow)" />,
  healthy: <CheckCircle size={14} color="var(--green)" />,
}
const STATUS_COLOR = { failed: 'var(--red)', down: 'var(--red)', degraded: 'var(--yellow)', healthy: 'var(--green)' }

export function AffectedServices({ services }) {
  if (!services?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.6s ease forwards' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Server size={16} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>AFFECTED SERVICES</span>
        <span style={{ marginLeft: 'auto', background: 'var(--border)', borderRadius: 10, padding: '2px 10px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{services.length}</span>
      </div>
      <div style={{ padding: '12px' }}>
        {services.map((svc, i) => {
          const status = svc.status?.toLowerCase() || 'degraded'
          const col = STATUS_COLOR[status] || 'var(--text-muted)'
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: i % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
              {STATUS_ICON[status] || STATUS_ICON.degraded}
              <span style={{ flex: 1, fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{svc.name}</span>
              {svc.role && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{svc.role}</span>}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: col, background: `${col}18`, border: `1px solid ${col}33`, borderRadius: 4, padding: '2px 8px', flexShrink: 0 }}>{status}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
