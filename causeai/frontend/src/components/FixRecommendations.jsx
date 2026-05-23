import { Wrench, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export function FixRecommendations({ immediateFix, permanentFix }) {
  const [openImmediate, setOpenImmediate] = useState(true)
  const [openPermanent, setOpenPermanent] = useState(false)

  if (!immediateFix && !permanentFix) return null

  function FixBlock({ title, content, color, open, setOpen }) {
    if (!content) return null
    return (
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
        <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: open ? 'var(--bg-secondary)' : 'transparent' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color, background: `${color}18`, border: `1px solid ${color}33`, borderRadius: 4, padding: '2px 8px', flexShrink: 0 }}>{title}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{title === 'IMMEDIATE' ? 'Immediate remediation steps' : 'Long-term prevention steps'}</span>
          {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
        {open && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{content}</pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.7s ease forwards' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Wrench size={16} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>REMEDIATION</span>
      </div>
      <div style={{ padding: '12px' }}>
        <FixBlock title="IMMEDIATE" content={immediateFix} color="var(--red)" open={openImmediate} setOpen={setOpenImmediate} />
        <FixBlock title="PERMANENT" content={permanentFix} color="var(--accent)" open={openPermanent} setOpen={setOpenPermanent} />
      </div>
    </div>
  )
}
