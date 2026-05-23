const BASE = '/api'

export async function analyzeIncident(logText, onStep) {
  const clientId = crypto.randomUUID()
  let ws = null

  try {
    ws = new WebSocket(`ws://localhost:3001/ws?clientId=${clientId}`)
    await new Promise((resolve, reject) => {
      ws.onopen = resolve
      ws.onerror = () => reject(new Error('WS failed'))
      setTimeout(() => reject(new Error('WS timeout')), 3000)
    })
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type !== 'connected' && msg.type !== 'done' && onStep) onStep(msg)
      } catch {}
    }
  } catch {
    ws = null
  }

  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ logs: logText, clientId: ws ? clientId : null }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Analysis failed')
  }

  const data = await res.json()

  if (!ws && data.steps && onStep) {
    data.steps.forEach((s, i) => onStep({ ...s, step: i }))
  }

  if (ws) ws.close()
  return data.result || data
}

export async function fetchIncidents() {
  const res = await fetch(`${BASE}/incidents`)
  if (!res.ok) throw new Error('Failed to fetch incidents')
  return res.json()
}

export async function sendChatMessage(analysis, message, history = []) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis, message, history }),
  })
  if (!res.ok) throw new Error('Chat request failed')
  return res.json()
}

export async function savePostmortem(incidentId, title, content) {
  const res = await fetch(`${BASE}/postmortem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incident_id: incidentId, title, content }),
  })
  if (!res.ok) throw new Error('Failed to save postmortem')
  return res.json()
}

export async function fetchPostmortems() {
  const res = await fetch(`${BASE}/postmortem`)
  if (!res.ok) throw new Error('Failed to fetch postmortems')
  return res.json()
}
