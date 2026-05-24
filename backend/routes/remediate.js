import express from 'express'
import { startRemediationAgent, approveRemediation, rejectRemediation, activeRuns } from '../agent/remediationAgent.js'
import { supabase } from '../db/supabase.js'

const router = express.Router()

router.post('/:incidentId/start', async (req, res) => {
  const { incidentId } = req.params

  const { data: analysis } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('incident_id', incidentId)
    .single()

  if (!analysis) return res.status(404).json({ error: 'No analysis found for this incident' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const onEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  startRemediationAgent(incidentId, analysis, onEvent)
    .then(() => res.end())
    .catch(err => {
      onEvent({ type: 'ERROR', message: err.message })
      res.end()
    })
})

router.post('/:incidentId/approve', (req, res) => {
  approveRemediation(req.params.incidentId)
  res.json({ approved: true })
})

router.post('/:incidentId/reject', (req, res) => {
  rejectRemediation(req.params.incidentId)
  res.json({ rejected: true })
})

router.get('/:incidentId/status', (req, res) => {
  const run = activeRuns.get(req.params.incidentId)
  if (!run) return res.json({ status: 'not_started' })
  res.json({ status: run.status, plan: run.plan, results: run.results })
})

export default router
