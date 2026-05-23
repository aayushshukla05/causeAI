import { useState } from 'react'
import { Terminal, Zap, AlertCircle } from 'lucide-react'

const SAMPLE = `[2024-01-15 03:42:11] ERROR: Database connection pool exhausted (pool_size=20)
[2024-01-15 03:42:12] WARN:  Query queue depth: 847 pending queries
[2024-01-15 03:42:13] ERROR: HTTP 503 on /api/checkout - upstream timeout after 30002ms
[2024-01-15 03:42:14] ERROR: Redis cache miss rate: 94.2% (degraded fallback mode)
[2024-01-15 03:42:15] CRITICAL: Payment service health check FAILED
[2024-01-15 03:42:16] ERROR: 1,247 failed transactions in last 60s`

export function LogInput({ onAnalyze, loading }) {
  const [logs, setLogs] = useState('')
  const [error, setError] = useState(null)

  function handleSubmit() {
    if (!logs.trim()) { setError('Paste some logs first'); return }
    setError(null)
    onAnalyze(logs)
  }

  return (
    <div style={{ animation: 'slide-in 0.3s ease forwards' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Terminal size={16} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>INCIDENT LOGS</span>
          </div>
          <button onClick={() => { setLogs(SAMPLE); setError(null) }} style={{ fontSize: 12, color: 'var(--accent-dim)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
            load sample
          </button>
        </div>
        <textarea
          value={logs}
          onChange={e => { setLogs(e.target.value); setError(null) }}
          placeholder="Paste your incident logs here..."
          spellCheck={false}
          style={{ width: '100%', minHeight: 220, background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-primary)' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          {error
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: 13 }}><AlertCircle size={14} />{error}</div>
            : <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{logs ? `${logs.split('\n').filter(Boolean).length} lines` : 'paste logs above'}</span>
          }
          <button onClick={handleSubmit} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: loading ? 'var(--border)' : 'var(--accent)', color: loading ? 'var(--text-secondary)' : '#000', border: 'none', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer' }}>
            <Zap size={14} />{loading ? 'ANALYZING...' : 'ANALYZE'}
          </button>
        </div>
      </div>
    </div>
  )
}
