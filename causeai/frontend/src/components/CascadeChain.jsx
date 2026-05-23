import { ArrowRight, Zap } from 'lucide-react'

const NODE_COLORS = ['var(--red)', 'var(--yellow)', 'var(--accent)', '#aa88ff', 'var(--green)']

export function CascadeChain({ chain }) {
  if (!chain?.length) return null

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.55s ease forwards' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Zap size={16} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>FAILURE CASCADE</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
          {chain.length} services
        </span>
      </div>
      <div style={{ padding: '24px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          {chain.map((service, i) => {
            const col = NODE_COLORS[Math.min(i, NODE_COLORS.length - 1)]
            const isFirst = i === 0
            const isLast = i === chain.length - 1
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <div style={{
                    padding: '8px 16px',
                    background: `${col}12`,
                    border: `1px solid ${col}44`,
                    borderRadius: 8,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: col,
                    boxShadow: isFirst ? `0 0 16px ${col}30` : 'none',
                    position: 'relative',
                  }}>
                    {service}
                    {isFirst && (
                      <div style={{
                        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                        color: col, background: 'var(--bg-card)', padding: '1px 6px',
                        border: `1px solid ${col}44`, borderRadius: 3,
                      }}>
                        ORIGIN
                      </div>
                    )}
                    {isLast && chain.length > 1 && (
                      <div style={{
                        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em',
                        color: col, background: 'var(--bg-card)', padding: '1px 6px',
                        border: `1px solid ${col}44`, borderRadius: 3, whiteSpace: 'nowrap',
                      }}>
                        BLAST RADIUS
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    step {i + 1}
                  </div>
                </div>
                {i < chain.length - 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginBottom: 18 }}>
                    <ArrowRight size={16} color="var(--text-muted)" />
                    <div style={{ width: 1, height: 8, background: 'var(--border)' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 20, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--red)' }}>{chain[0]}</span>
          {' failure propagated through '}
          <span style={{ color: 'var(--text-secondary)' }}>{chain.length - 1} downstream service{chain.length > 2 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}
