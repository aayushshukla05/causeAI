import { Router } from 'express'
import { fetchIncidentHistory, fetchServiceTrend, getFullIncident, fetchIncidentsByDate, fetchSimilarIncidents, fetchIncidentDNA } from '../db/supabase.js'
import { getShadowAnalysisSystemPrompt, buildShadowUserPrompt } from '../agent/prompts.js'
import Groq from 'groq-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const router = Router()

// Shadow Incident Detection — must be before /:id routes
router.get('/shadow/scan', async (req, res) => {
  try {
    // Read the shadow logs file
    const logsPath = path.join(__dirname, '..', 'scripts', 'shadow-logs.txt')
    const logs = fs.readFileSync(logsPath, 'utf-8')

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      temperature: 0.1,
      messages: [
        { role: 'system', content: getShadowAnalysisSystemPrompt() },
        { role: 'user', content: buildShadowUserPrompt(logs) }
      ]
    })

    const raw = completion.choices?.[0]?.message?.content || '{}'
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    res.json({
      shadowIncidents: parsed.shadowIncidents || [],
      scannedAt: new Date().toISOString(),
      logLines: logs.split('\n').filter(Boolean).length
    })
  } catch (err) {
    console.error('[SHADOW] scan error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10) || 50
  try {
    const incidents = await fetchIncidentHistory(Math.max(1, Math.min(limit, 200)))
    res.json({ incidents, total: incidents.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/trend/:serviceName', async (req, res) => {
  const serviceName = req.params.serviceName?.trim()
  if (!serviceName) return res.status(400).json({ error: 'serviceName is required' })

  try {
    const trend = await fetchServiceTrend(serviceName)
    res.json(trend)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/heatmap', async (req, res) => {
  const days = Number.parseInt(req.query.days, 10) || 90;
  try {
    const data = await fetchIncidentsByDate(Math.max(7, Math.min(days, 365)));
    res.json({ heatmap: data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/similar', async (req, res) => {
  try {
    const incident = await getFullIncident(req.params.id)
    if (!incident || !incident.latest_analysis) return res.json({ similarIncidents: [], incidentDna: null })

    const analysis = incident.latest_analysis
    const rootCauseService = analysis.root_cause_service || analysis.rootCauseService
    const affectedServices = analysis.affected_services || analysis.affectedServices || []
    const severity = analysis.severity || 'P2'
    const rootCauseText = analysis.root_cause || analysis.rootCause || ''

    const similarIncidents = await fetchSimilarIncidents(rootCauseService, affectedServices, severity, req.params.id, rootCauseText)
    const incidentDna = fetchIncidentDNA(analysis)

    res.json({ similarIncidents, incidentDna })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const incident = await getFullIncident(req.params.id)
    if (!incident) return res.status(404).json({ error: 'Incident not found' })
    res.json(incident)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

