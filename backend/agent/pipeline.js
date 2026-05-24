import Groq from 'groq-sdk';
import { getAnalysisSystemPrompt, buildAnalysisUserPrompt } from './prompts.js';
import { insertIncident, insertAnalysisResult, fetchRecentAnalyses } from '../db/supabase.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function extractNumber(logs, patterns) {
  for (const pattern of patterns) {
    let match;
    const re = new RegExp(pattern, 'gi');
    while ((match = re.exec(logs))) {
      const val = parseInt(match[1].replace(/,/g, ''), 10);
      if (!isNaN(val)) return val;
    }
  }
  return 0;
}

function normalizeBlastRadius(blast, logs) {
  if (!blast || typeof blast !== 'object') return {};
  const raw = logs || '';

  const messagesStuck = Math.max(
    Number(blast.estimatedMessagesStuck) || 0,
    extractNumber(raw, [
      '(\\d[\\d,]*)\\s+(?:webhook|email|message|notification)s?\\s+(?:deliveries?\\s+)?(?:queued|stuck|pending|stalled)',
      '(\\d[\\d,]*)\\s+pending\\s+(?:emails?|messages?|webhooks?)'
    ])
  );

  const guestOrders = Math.max(
    0,
    extractNumber(raw, [
      '(\\d[\\d,]*)\\s+orders?\\s+placed\\s+in\\s+guest',
      '(\\d[\\d,]*)\\s+guest.{0,10}orders?',
      '(\\d[\\d,]*)\\s+orders?.*?no\\s+user_id'
    ])
  );

  const requestsFailed = Math.max(
    0,
    extractNumber(raw, [
      '(\\d[\\d,]*)\\s+(?:payment|charge|api)\\s+requests?\\s+(?:rejected|failed|dropped)',
      '(\\d[\\d,]*)\\s+requests?\\s+(?:rejected|failed|dropped)',
      '(\\d[\\d,]*)\\s+requests?\\s+returned\\s+5\\d\\d',
      'rejecting\\s+(\\d[\\d,]*)\\s+requests?',
      'dropped\\s+(\\d[\\d,]*)\\s+requests?',
      '(\\d[\\d,]*)\\s+requests?\\s+timed?\\s*out',
      'failed\\s+to\\s+process\\s+(\\d[\\d,]*)\\s+requests?'
    ])
  );

  return {
    estimatedUsersAffected: Number(blast.estimatedUsersAffected) || 0,
    estimatedRequestsFailed: requestsFailed,
    estimatedMessagesStuck: messagesStuck,
    estimatedOversoldOrders: Number(blast.estimatedOversoldOrders) || 0,
    estimatedMisroutedOrders: Number(blast.estimatedMisroutedOrders) || 0,
    estimatedGuestOrders: guestOrders,
    affectedEndpoints: Array.isArray(blast.affectedEndpoints) ? blast.affectedEndpoints : [],
    methodology: blast.methodology || ''
  };
}

function fixServiceStatuses(affectedServices, logs) {
  if (!Array.isArray(affectedServices)) return [];
  return affectedServices.map(svc => {
    let status = (svc.status || 'unknown').toLowerCase();
    const svcLogs = logs.split('\n').filter(l => l.includes(svc.name)).join(' ').toLowerCase();
    if (status === 'failed' && /falling back|fallback|using default|bypass|in-memory mode|degraded mode|cached tokens|guest.?mode/.test(svcLogs)) {
      status = 'degraded';
    }
    if (status === 'unknown' && /error|failed|timeout|rejected|exhausted|expired/.test(svcLogs)) {
      status = 'degraded';
    }
    return { ...svc, status };
  });
}

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
    const sanitized = jsonMatch[0].replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, ' ');
    parsed = JSON.parse(sanitized);
  } catch (err) {
    throw new Error('Failed to parse AI response: ' + err.message);
  }

  parsed.blastRadius = normalizeBlastRadius(parsed.blastRadius, logs);
  parsed.affectedServices = fixServiceStatuses(parsed.affectedServices, logs);

  await onStep({ step: 4, label: 'Tracing failure cascade', detail: `Cascade: ${(parsed.cascadeChain || []).join(' → ')}`, status: 'complete' });
  await onStep({ step: 5, label: 'Saving to incident history', detail: 'Writing to database...', status: 'running' });

  const incident = await insertIncident(logs, scenarioName || 'manual');
  const analysis = await insertAnalysisResult(incident.id, parsed);

  await onStep({ step: 5, label: 'Saving to incident history', detail: 'Incident saved successfully', status: 'complete' });

  return { ...parsed, incidentId: incident.id, analysisId: analysis.id };
}
