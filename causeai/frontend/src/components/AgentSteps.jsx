import { CheckCircle, Circle, Loader, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const STEP_META = [
  { label: 'Log Ingestion', desc: 'Parsing and normalizing raw log data' },
  { label: 'Pattern Detection', desc: 'Identifying error signatures and anomalies' },
  { label: 'Correlation Analysis', desc: 'Mapping causal relationships across services' },
  { label: 'Root Cause Inference', desc: 'Reasoning about the primary failure origin' },
  { label: 'Fix Synthesis', desc: 'Generating actionable remediation steps' },
]

function StepRow({ meta, status, detail, index }) {
  const [open, setOpen] = useState(false)
  const isDone = status === 'done'
  const isActive = status === 'active'
  const isPending = status === 'pending'
  return (
    <div style={{ borderBottom: '1px solid var(--border)', opacity: isPending ? 0.4 : 1, transition: 'opacity 0.3s' }}>
      <div onClick={() => isDone && detail && setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: isDone && detail ? 'pointer' : 'default' }}>
        <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isDone && <CheckCircle size={18} color="var(--green)" />}
          {isActive && <Loader size={18} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />}
          {isPending && <Circle size={18} color="var(--text-muted)" />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{String(index + 1).padStart(2, '0')}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? 'var(--accent)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>{meta.label}</span>
            {isActive && <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', animation: 'pulse-glow 1.5s ease-in-out infinite' }}>running</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{meta.desc}</div>
        </div>
        {isDone && detail && (open ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />)}
      </div>
      {open && detail && (
        <div style={{ margin: '0 20px 12px 56px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {detail}
        </div>
      )}
    </div>
  )
}

export function AgentSteps({ steps, currentStep }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.4s ease forwards' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentStep < STEP_META.length ? 'var(--accent)' : 'var(--green)', animation: currentStep < STEP_META.length ? 'pulse-glow 1.5s ease-in-out infinite' : 'none' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>AGENT PIPELINE</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{Math.min(currentStep, STEP_META.length)}/{STEP_META.length}</span>
      </div>
      {STEP_META.map((meta, i) => (
        <StepRow key={i} index={i} meta={meta} status={i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'} detail={steps[i]?.detail || null} />
      ))}
    </div>
  )
}
