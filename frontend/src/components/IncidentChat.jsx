import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader, Bot, User } from 'lucide-react'

const SUGGESTIONS = [
  'Why did this incident happen?',
  'How do I prevent this in future?',
  'What was the business impact?',
  'Which team should own this fix?',
]

export function IncidentChat({ analysis }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `I've analyzed this incident. The root cause is **${analysis.rootCause || analysis.root_cause || 'unknown'}** in the **${analysis.rootCauseService || analysis.root_cause_service || 'unknown'}** service. Ask me anything about it.` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const userMsg = text || input.trim()
    if (!userMsg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, analysis }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || data.message || 'No response' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Make sure the backend chat route is implemented.' }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'slide-in 0.75s ease forwards', display: 'flex', flexDirection: 'column', height: 420 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <MessageSquare size={16} color="var(--accent)" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>CHAT WITH INCIDENT</span>
        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-glow 2s ease-in-out infinite' }} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {msg.role === 'user' ? <User size={13} color="#000" /> : <Bot size={13} color="var(--accent)" />}
            </div>
            <div style={{ maxWidth: '75%', padding: '10px 14px', background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)', border: `1px solid ${msg.role === 'user' ? 'transparent' : 'var(--border)'}`, borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontSize: 13, lineHeight: 1.6, color: msg.role === 'user' ? '#000' : 'var(--text-primary)', fontWeight: msg.role === 'user' ? 500 : 400 }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={13} color="var(--accent)" />
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader size={13} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 1 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)} style={{ fontSize: 11, color: 'var(--accent-dim)', background: 'var(--accent-glow)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this incident..."
          style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ width: 36, height: 36, background: input.trim() ? 'var(--accent)' : 'var(--border)', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed' }}>
          <Send size={14} color={input.trim() ? '#000' : 'var(--text-muted)'} />
        </button>
      </div>
    </div>
  )
}
