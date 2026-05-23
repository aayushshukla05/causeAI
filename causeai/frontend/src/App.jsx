import { useState, useCallback, useEffect } from 'react'
import { LogInput } from './components/LogInput'
import { AgentSteps } from './components/AgentSteps'
import { RootCauseCard } from './components/RootCauseCard'
import { AffectedServices } from './components/AffectedServices'
import { IncidentTimeline } from './components/IncidentTimeline'
import { FixRecommendations } from './components/FixRecommendations'
import { CascadeChain } from './components/CascadeChain'
import { IncidentHistory } from './components/IncidentHistory'
import { PostmortemModal } from './components/PostmortemModal'
import { PostmortemsTab } from './components/PostmortemsTab'
import { IncidentChat } from './components/IncidentChat'
import { AuthModal } from './components/AuthModal'
import { analyzeIncident } from './utils/api'
import { supabase } from './utils/supabase'
import { Activity, History, Plus, FileText, BookOpen, LogIn, LogOut, User } from 'lucide-react'

export default function App() {
  const [view, setView] = useState('analyze')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [steps, setSteps] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showPostmortem, setShowPostmortem] = useState(false)
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleAnalyze = useCallback(async (logs) => {
    setLoading(true)
    setResult(null)
    setError(null)
    setSteps([])
    setCurrentStep(0)
    setView('analyze')
    try {
      const analysis = await analyzeIncident(logs, (step) => {
        setCurrentStep(step.step + 1)
        setSteps(prev => { const next = [...prev]; next[step.step] = step; return next })
      })
      setCurrentStep(5)
      setResult(analysis)
    } catch (err) {
      setError(err.message)
      setCurrentStep(-1)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReset = () => { setResult(null); setError(null); setCurrentStep(-1); setSteps([]) }
  const showPipeline = loading || currentStep >= 0

  const tabs = [
    { id: 'analyze', label: 'Analyze', icon: <Plus size={13} /> },
    { id: 'history', label: 'History', icon: <History size={13} /> },
    { id: 'postmortems', label: 'Postmortems', icon: <BookOpen size={13} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 60 }}>
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="header-inner" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 0, height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={16} color="#000" />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, letterSpacing: '0.05em' }}>
              Cause<span style={{ color: 'var(--accent)' }}>AI</span>
            </span>
          </div>

          <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: view === tab.id ? 'var(--accent-glow)' : 'none', border: view === tab.id ? '1px solid var(--border-bright)' : '1px solid transparent', borderRadius: 6, color: view === tab.id ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            {result && view === 'analyze' && (
              <button onClick={() => setShowPostmortem(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                <FileText size={13} />postmortem
              </button>
            )}
            {result && view === 'analyze' && (
              <button onClick={handleReset}
                style={{ padding: '6px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                new
              </button>
            )}
            {user ? (
              <button onClick={() => supabase.auth.signOut()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                <User size={12} /><LogOut size={12} />
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--accent-glow)', border: '1px solid var(--border-bright)', borderRadius: 6, color: 'var(--accent)', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
                <LogIn size={12} />login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {view === 'history' && (
          <IncidentHistory onSelectIncident={(inc) => {
            const r = inc.analysis_results?.[0]
            if (r) { setResult(r); setCurrentStep(5); setView('analyze') }
          }} />
        )}

        {view === 'postmortems' && <PostmortemsTab />}

        {view === 'analyze' && (
          <>
            {error && (
              <div style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--red)' }}>
                ✗ {error}
              </div>
            )}

            {!showPipeline && !result && (
              <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div style={{ marginBottom: 32, textAlign: 'center' }}>
                  <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Paste your incident logs</h1>
                  <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>The AI pipeline identifies root causes, maps affected services, and generates a remediation plan.</p>
                </div>
                <LogInput onAnalyze={handleAnalyze} loading={loading} />
              </div>
            )}

            {showPipeline && (
              <div className="grid-2col" style={{ marginBottom: 24 }}>
                <AgentSteps steps={steps} currentStep={currentStep} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {result && <RootCauseCard analysis={result} />}
                  {result && <AffectedServices services={result.affectedServices || result.affected_services} />}
                </div>
              </div>
            )}

            {result && (
              <>
                {(result.cascadeChain || result.cascade_chain)?.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <CascadeChain chain={result.cascadeChain || result.cascade_chain} />
                  </div>
                )}
                <div className="grid-2col" style={{ marginBottom: 24 }}>
                  <IncidentTimeline events={result.timeline} />
                  <FixRecommendations immediateFix={result.immediateFix || result.immediate_fix} permanentFix={result.permanentFix || result.permanent_fix} />
                </div>
                <IncidentChat analysis={result} />
              </>
            )}
          </>
        )}
      </main>

      {showPostmortem && result && (
        <PostmortemModal analysis={result} onClose={() => setShowPostmortem(false)} />
      )}

      {showAuth && (
        <AuthModal
          onAuth={(_session, u) => { setUser(u); setShowAuth(false) }}
          onClose={() => setShowAuth(false)}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
