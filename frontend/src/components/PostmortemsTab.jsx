import { useState, useEffect } from 'react'
import { fetchPostmortems } from '../utils/api.js'
import { Download, Copy, FileText } from 'lucide-react'

export function PostmortemsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchPostmortems().then(setItems).catch(console.error).finally(() => setLoading(false))
  }, [])

  function download(pm) {
    const blob = new Blob([pm.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${pm.title || 'postmortem'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60, fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading postmortems...</div>
  if (items.length === 0) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>
      <FileText size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>No postmortems saved yet.</p>
      <p style={{ fontSize: 13 }}>Generate one from the Analyze tab after an incident.</p>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '300px 1fr' : '1fr', gap: 20 }} className="postmortems-layout">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(pm => (
          <div key={pm.id} onClick={() => setSelected(pm)}
            style={{ padding: 16, borderRadius: 10, background: selected?.id === pm.id ? 'var(--accent-glow)' : 'var(--bg-card)', border: `1px solid ${selected?.id === pm.id ? 'var(--border-bright)' : 'var(--border)'}`, cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: selected?.id === pm.id ? 'var(--accent)' : 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>
              {pm.title || 'Untitled'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date(pm.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>{selected.title}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigator.clipboard.writeText(selected.content)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                <Copy size={11} />copy
              </button>
              <button onClick={() => download(selected)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#000', fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}>
                <Download size={11} />.md
              </button>
            </div>
          </div>
          <pre style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '70vh', fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {selected.content}
          </pre>
        </div>
      )}
    </div>
  )
}
