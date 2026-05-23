import { AlertTriangle, TrendingUp } from 'lucide-react'

function ConfidenceBar({ value }) {
  const pct = Math.round((value > 1 ? value : value * 100))
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--yellow)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 1s ease', boxShadow: `0 0 8px ${color}` }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color, minWidth: 40 }}>{pct}%</span>
    </div>
  )
}

export function RootCauseCard({ analysis }) {
  if (!analysis) return null
  const rootCause = analysis.rootCause || analysis.root_cause || 'Unknown'
  const confidence = analysis.confidenceScore || analysis.confidence_score || analysis.confidence || 0
  const severity = analysis.severity || 'unknown'
  const severityColor = { critical: 'var(--red)', p0: 'var(--red)', high: 'var(--yellow)', p1: 'var(--yellow)', medium: 'var(--accent)', p2: 'var(--accent)', low: 'var(--green)' }[severity?.toLowerCase()] || 'var(--text-muted)'

  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid ${severityColor}55`, borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.5s ease forwards', boxShadow: `0 0 40px ${severityColor}10` }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${severityColor}33`, background: `${severityColor}08`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color={severityColor} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>ROOT CAUSE</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: severityColor, background: `${severityColor}18`, border: `1px solid ${severityColor}44`, borderRadius: 4, padding: '3px 10px' }}>
          {severity?.toUpperCase()}
        </span>
      </div>
      <div style={{ padding: '20px' }}>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 20 }}>{rootCause}</p>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TrendingUp size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>CONFIDENCE</span>
          </div>
          <ConfidenceBar value={confidence} />
        </div>
      </div>
    </div>
  )
}
