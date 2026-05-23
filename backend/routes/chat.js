import { Router } from 'express'
import Groq from 'groq-sdk'
import { buildChatSystemPrompt } from '../agent/prompts.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const router = Router()

router.post('/', async (req, res) => {
  const { analysis, message, history = [] } = req.body
  if (!message) return res.status(400).json({ error: 'message is required' })

  const normalized = {
    root_cause: analysis?.rootCause || analysis?.root_cause || 'Unknown',
    root_cause_service: analysis?.rootCauseService || analysis?.root_cause_service || 'Unknown',
    severity: analysis?.severity || 'Unknown',
    immediate_fix: analysis?.immediateFix || analysis?.immediate_fix || '',
    permanent_fix: analysis?.permanentFix || analysis?.permanent_fix || '',
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        { role: 'system', content: buildChatSystemPrompt(normalized) },
        ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ]
    })
    res.json({ reply: completion.choices[0].message.content })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
