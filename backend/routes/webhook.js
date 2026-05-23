import { Router } from 'express'
import { runAnalysisPipeline } from '../agent/pipeline.js'

const router = Router()

function extractLogs(body) {
  if (body.type === 'event_callback') {
    return (body.event?.text || '').replace(/<[^>]+>/g, '').trim()
  }
  if (body.messages?.[0]?.incident) {
    const inc = body.messages[0].incident
    return `PagerDuty Alert\nTitle: ${inc.title || ''}\nService: ${inc.service?.summary || ''}\nDescription: ${inc.description || ''}`
  }
  return body.logs || body.text || body.message || JSON.stringify(body)
}

router.post('/', async (req, res) => {
  if (req.body.challenge) return res.json({ challenge: req.body.challenge })
  const logs = extractLogs(req.body)
  if (!logs || !logs.trim()) return res.status(400).json({ error: 'No log content extracted' })
  try {
    const result = await runAnalysisPipeline(logs, 'webhook', async () => {})
    res.json({ success: true, result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
