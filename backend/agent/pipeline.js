import Groq from 'groq-sdk';
import { getAnalysisSystemPrompt, buildAnalysisUserPrompt } from './prompts.js';
import { insertIncident, insertAnalysisResult, fetchRecentAnalyses } from '../db/supabase.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function runAnalysisPipeline(logs, scenarioName, onStep) {
  const lines = logs.split('\n').filter(l => l.trim());
  const services = [...new Set(lines.map(l => {
    const m = l.match(/\b([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/);
    return m ? m[1] : null;
  }).filter(Boolean))];

  await onStep({ step: 1, label: 'Parsing log structure', detail: `Found ${lines.length} log lines across ${services.length} services: ${services.join(', ')}`, status: 'complete' });

  const pastIncidents = await fetchRecentAnalyses(20);
  await onStep({ step: 2, label: 'Querying incident history', detail: `Found ${pastIncidents.length} historical incidents for pattern matching`, status: 'complete' });

  await onStep({ step: 3, label: 'Identifying root cause', detail: 'AI agent analyzing failure cascade...', status: 'running' });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 4000,
    temperature: 0.1,
    messages: [
      { role: 'system', content: getAnalysisSystemPrompt() },
      { role: 'user', content: buildAnalysisUserPrompt(logs, pastIncidents) }
    ]
  });

  const rawResponse = completion.choices[0].message.content;
  await onStep({ step: 3, label: 'Identifying root cause', detail: 'Root cause identified', status: 'complete' });

  let parsed;
  try {
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (err) {
    throw new Error('Failed to parse AI response: ' + err.message);
  }

  await onStep({ step: 4, label: 'Tracing failure cascade', detail: `Cascade: ${(parsed.cascadeChain || []).join(' → ')}`, status: 'complete' });

  await onStep({ step: 5, label: 'Saving to incident history', detail: 'Writing to database...', status: 'running' });

  const incident = await insertIncident(logs, scenarioName || 'manual');
  const analysis = await insertAnalysisResult(incident.id, parsed);

  await onStep({ step: 5, label: 'Saving to incident history', detail: 'Incident saved successfully', status: 'complete' });

  return { ...parsed, incidentId: incident.id, analysisId: analysis.id };
}
