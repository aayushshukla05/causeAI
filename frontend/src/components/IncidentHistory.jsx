import { useState, useEffect } from 'react'
import { History, ChevronRight, AlertTriangle, Clock, Database } from 'lucide-react'
import { fetchIncidents } from '../utils/api'

const SEV_COLOR = {
  p0: 'var(--red)', critical: 'var(--red)',
  p1: 'var(--yellow)', high: 'var(--yellow)',
  p2: 'var(--accent)', medium: 'var(--accent)',
  low: 'var(--green)',
}

function IncidentRow({ incident, onClick }) {
  const result = incident.analysis_results?.[0]
  const sev = result?.severity?.toLowerCase() || 'unknown'
  const col = SEV_COLOR[sev] || 'var(--text-muted)'
  const date = new Date(incident.created_at)
  const timeAgo = getTimeAgo(date)

  return (
    <div
      onClick={() => onClick(incident)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0, boxShadow: `0 0 6px ${col}` }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {result?.root_cause || incident.scenario_name || 'Unknown incident'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {result?.root_cause_service && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-dim)' }}>{result.root_cause_service}</span>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} />{timeAgo}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {result?.confidence_score && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            {Math.round(result.confidence_score > 1 ? result.confidence_score : result.confidence_score * 100)}%
          </span>
        )}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: col, background: `${col}18`, border: `1px solid ${col}33`, borderRadius: 4, padding: '2px 8px' }}>
          {sev.toUpperCase()}
        </span>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </div>
  )
}

function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function IncidentHistory({ onSelectIncident }) {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchIncidents()
      .then(data => setIncidents(data.incidents || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.3s ease forwards' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <History size={16} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>INCIDENT HISTORY</span>
        {!loading && (
          <span style={{ marginLeft: 'auto', background: 'var(--border)', borderRadius: 10, padding: '2px 10px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {incidents.length}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          loading incidents...
        </div>
      )}

      {error && (
        <div style={{ padding: 20, color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>✗ {error}</div>
      )}

      {!loading && !error && incidents.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Database size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No incidents yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>Analyze your first incident to see history here</div>
        </div>
      )}

      {!loading && incidents.map(inc => (
        <IncidentRow key={inc.id} incident={inc} onClick={onSelectIncident} />
      ))}
    </div>
  )
}
