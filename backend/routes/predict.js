import { Router } from 'express';
import Groq from 'groq-sdk';
import { getPredictionSystemPrompt } from '../agent/prompts.js';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/', async (req, res) => {
  const { deployDescription } = req.body;
  if (!deployDescription?.trim()) return res.status(400).json({ error: 'deployDescription is required' });
  try {
    const completion = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', max_tokens: 1000, temperature: 0.15, messages: [{ role: 'system', content: getPredictionSystemPrompt() }, { role: 'user', content: `Analyze this planned change and predict blast radius:\n\n${deployDescription.trim()}` }] });
    const raw = completion.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse response' });
    res.json({ prediction: JSON.parse(match[0]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
