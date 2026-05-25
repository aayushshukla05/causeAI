import Groq from 'groq-sdk';
import { getAnalysisSystemPrompt, buildAnalysisUserPrompt } from './prompts.js';
import { supabase, insertIncident, insertAnalysisResult, fetchRecentAnalyses, fetchSimilarIncidents, fetchIncidentDNA } from '../db/supabase.js';

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

export async function runAnalysisPipeline(logs, scenarioName, onStep, incidentId = null) {
  const lines = logs.split('\n').filter(l => l.trim());
  const services = [...new Set(lines.map(l => {
    const m = l.match(/\b([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b/);
    return m ? m[1] : null;
  }).filter(Boolean))];

  await onStep({ step: 1, label: 'Parsing log structure', detail: `Found ${lines.length} log lines across ${services.length} services: ${services.join(', ')}`, status: 'complete' });

  const pastIncidents = await fetchRecentAnalyses(20);
  await onStep({ step: 2, label: 'Querying incident history', detail: `Found ${pastIncidents.length} historical incidents for pattern matching`, status: 'complete' });

  await onStep({ step: 3, label: 'Identifying root cause', detail: 'AI agent analyzing failure cascade...', status: 'running' });

  let parsed;
  try {
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

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const sanitized = jsonMatch[0].replace(/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, ' ').replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
    parsed = JSON.parse(sanitized);
  } catch (err) {
    console.error('[Groq AI Analysis Failed, using SRE mock fallback]:', err.message);
    await onStep({ step: 3, label: 'Identifying root cause', detail: 'Using SRE rule-based fallback model', status: 'complete' });
    parsed = generateMockAnalysis(logs, scenarioName);
  }

  parsed.blastRadius = normalizeBlastRadius(parsed.blastRadius, logs);
  parsed.affectedServices = fixServiceStatuses(parsed.affectedServices, logs);

  await onStep({ step: 4, label: 'Tracing failure cascade', detail: `Cascade: ${(parsed.cascadeChain || []).join(' → ')}`, status: 'complete' });
  await onStep({ step: 5, label: 'Saving to incident history', detail: 'Writing to database...', status: 'running' });

  let targetIncident = null;
  if (incidentId) {
    const { data } = await supabase.from('incidents').select('*').eq('id', incidentId).maybeSingle();
    targetIncident = data;
  }
  if (!targetIncident) {
    targetIncident = await insertIncident(logs, scenarioName || 'manual');
  }
  const analysis = await insertAnalysisResult(targetIncident.id, parsed);

  await onStep({ step: 5, label: 'Saving to incident history', detail: 'Incident saved successfully', status: 'complete' });

  const similarIncidents = await fetchSimilarIncidents(
    parsed.rootCauseService || parsed.root_cause_service,
    parsed.affectedServices || [],
    parsed.severity,
    targetIncident.id,
    parsed.rootCause || parsed.root_cause
  )
  await onStep({ step: 6, label: 'Scanning for similar past incidents', detail: similarIncidents.length > 0 ? `Found ${similarIncidents.length} similar incident(s)` : 'No similar incidents found', status: 'complete' })

  const incidentDna = fetchIncidentDNA(parsed);

  return { ...parsed, incidentId: targetIncident.id, analysisId: analysis.id, similarIncidents, incidentDna };
}

function generateMockAnalysis(logs, scenarioName) {
  const isRedis = logs.toLowerCase().includes('redis');
  const isDeploy = logs.toLowerCase().includes('deploy') || logs.toLowerCase().includes('rollout');
  const isPostgres = logs.toLowerCase().includes('postgres') || logs.toLowerCase().includes('pg_');
  
  let rootCause = "Unexpected resource exhaustion or rate limit error";
  let rootCauseService = "api-gateway";
  let severity = "P1";
  let businessImpact = "Degraded performance on gateway endpoints";
  let cascadeChain = ["api-gateway"];
  let affectedServices = [{ name: "api-gateway", status: "degraded", errorCount: 15, role: "root cause" }];
  
  if (isRedis) {
    rootCause = "Redis Maxmemory reached, eviction failed under memory pressure";
    rootCauseService = "redis";
    severity = "P0";
    businessImpact = "Checkout and session verification failing due to connection pool starvation";
    cascadeChain = ["redis", "auth-service", "api-gateway"];
    affectedServices = [
      { name: "redis", status: "failed", errorCount: 1, role: "root cause" },
      { name: "auth-service", status: "degraded", errorCount: 45, role: "cascade" },
      { name: "api-gateway", status: "degraded", errorCount: 15, role: "cascade" }
    ];
  } else if (isDeploy) {
    rootCause = "NullPointerException in new payment confirm route after v2.3.2 rollout";
    rootCauseService = "payment-service";
    severity = "P0";
    businessImpact = "Global payment confirmations timing out, blocking checkout flow";
    cascadeChain = ["payment-service", "order-service", "api-gateway"];
    affectedServices = [
      { name: "payment-service", status: "failed", errorCount: 12, role: "root cause" },
      { name: "order-service", status: "degraded", errorCount: 8, role: "cascade" },
      { name: "api-gateway", status: "degraded", errorCount: 3, role: "cascade" }
    ];
  } else if (isPostgres) {
    rootCause = "Postgres connection pool exhausted under peak concurrency limits";
    rootCauseService = "postgres";
    severity = "P0";
    businessImpact = "Database connection refused, core data services offline";
    cascadeChain = ["postgres", "user-service", "api-gateway"];
    affectedServices = [
      { name: "postgres", status: "failed", errorCount: 1, role: "root cause" },
      { name: "user-service", status: "degraded", errorCount: 22, role: "cascade" },
      { name: "api-gateway", status: "degraded", errorCount: 5, role: "cascade" }
    ];
  }

  return {
    rootCause,
    rootCauseService,
    confidenceScore: 90,
    severity,
    businessImpact,
    timeline: [
      { time: "08:00:00", service: rootCauseService, event: "Incident start detected", description: rootCause },
      { time: "08:01:15", service: cascadeChain[1] || rootCauseService, event: "Downstream degradation", description: "Response latency spikes above SLA limits" }
    ],
    affectedServices,
    cascadeChain,
    immediateFix: "Step 1: Restart target service. Step 2: Verify connectivity. Step 3: Monitor errors.",
    permanentFix: "Step 1: Update limits configuration. Step 2: Configure alerts thresholds. Step 3: Architect fallbacks.",
    blastRadius: {
      estimatedUsersAffected: 1000,
      estimatedRequestsFailed: 1500,
      estimatedMessagesStuck: 0,
      estimatedOversoldOrders: 0,
      estimatedMisroutedOrders: 0,
      affectedEndpoints: ["/api/checkout", "/api/gateway"]
    },
    alternatives: []
  };
}
