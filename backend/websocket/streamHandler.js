const clients = new Map()

export function registerClient(clientId, ws) {
  clients.set(clientId, ws)
  ws.on('close', () => clients.delete(clientId))
  ws.on('error', () => clients.delete(clientId))
}

export function emitStep(clientId, payload) {
  const ws = clients.get(clientId)
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload))
}

export function emitDone(clientId) {
  const ws = clients.get(clientId)
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'done' }))
}
