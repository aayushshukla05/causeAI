import { Router } from 'express';
import Groq from 'groq-sdk';
import { fetchRecentIncidentsForBriefing } from '../db/supabase.js';
import { getBriefingSystemPrompt } from '../agent/prompts.js';

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/', async (req, res) => {
  try {
    const incidents = await fetchRecentIncidentsForBriefing(20);
    if (!incidents.length) return res.json({ briefing: { summary: 'No incidents found. Clean shift ahead.', recurringIssues: [], activeP0s: [], recommendedActions: ['Monitor system health'], healthSignal: 'green', generatedAt: new Date().toISOString(), incidentCount: 0 } });
    const incidentSummary = incidents.map((inc, i) => { const age = Math.floor((Date.now() - new Date(inc.created_at).getTime()) / 3600000); return `${i + 1}. [${inc.severity}] ${inc.scenario_name || inc.root_cause || 'Unknown'} — service: ${inc.root_cause_service || 'unknown'} — ${age}h ago`; }).join('\n');
    const completion = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', max_tokens: 1000, temperature: 0.2, messages: [{ role: 'system', content: getBriefingSystemPrompt() }, { role: 'user', content: `Generate an on-call shift briefing from these recent incidents:\n\n${incidentSummary}\n\nReturn only JSON.` }] });
    const raw = completion.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Failed to parse briefing' });
    res.json({ briefing: { ...JSON.parse(match[0]), generatedAt: new Date().toISOString(), incidentCount: incidents.length } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
