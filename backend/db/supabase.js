import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

function normalizeAnalysisInput(analysisData) {
  const rawConfidence = analysisData?.confidenceScore ?? analysisData?.confidence_score ?? null
  const normalizedConfidence =
    typeof rawConfidence === 'number'
      ? rawConfidence <= 1
        ? Math.round(rawConfidence * 100)
        : Math.round(rawConfidence)
      : null

  return {
    rootCause: analysisData?.rootCause ?? analysisData?.root_cause ?? null,
    rootCauseService: analysisData?.rootCauseService ?? analysisData?.root_cause_service ?? null,
    confidenceScore: normalizedConfidence,
    severity: analysisData?.severity ?? null,
    businessImpact: analysisData?.businessImpact ?? analysisData?.business_impact ?? null,
    timeline: analysisData?.timeline ?? [],
    affectedServices: analysisData?.affectedServices ?? analysisData?.affected_services ?? [],
    cascadeChain: analysisData?.cascadeChain ?? analysisData?.cascade_chain ?? [],
    immediateFix: analysisData?.immediateFix ?? analysisData?.immediate_fix ?? null,
    permanentFix: analysisData?.permanentFix ?? analysisData?.permanent_fix ?? null,
    historicalMatch: analysisData?.historicalMatch ?? analysisData?.historical_match ?? null,
    blastRadius: analysisData?.blastRadius ?? analysisData?.blast_radius ?? null,
    alternatives: analysisData?.alternatives ?? [],
  }
}

export async function insertIncident(rawLogs, scenarioName) {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .insert({
        raw_logs: rawLogs,
        scenario_name: scenarioName,
        log_line_count: rawLogs.split('\n').filter(Boolean).length,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('[DB] insertIncident error:', err.message)
    throw err
  }
}

export async function insertAnalysisResult(incidentId, analysisData) {
  const a = normalizeAnalysisInput(analysisData)

  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .insert({
        incident_id: incidentId,
        root_cause: a.rootCause,
        root_cause_service: a.rootCauseService,
        confidence_score: a.confidenceScore,
        severity: a.severity,
        business_impact: a.businessImpact,
        timeline: a.timeline,
        affected_services: a.affectedServices,
        cascade_chain: a.cascadeChain,
        immediate_fix: a.immediateFix,
        permanent_fix: a.permanentFix,
        historical_match: a.historicalMatch,
        blast_radius: a.blastRadius,
        alternatives: a.alternatives,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('[DB] insertAnalysisResult error:', err.message)
    throw err
  }
}

export async function fetchRecentAnalyses(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[DB] fetchRecentAnalyses error:', err.message)
    return []
  }
}

export async function fetchIncidentHistory(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select(
        'id, scenario_name, created_at, analysis_results(id, incident_id, created_at, root_cause, severity, confidence_score, root_cause_service, business_impact, timeline, affected_services, cascade_chain, immediate_fix, permanent_fix, blast_radius, alternatives)',
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((incident) => {
      const latest = Array.isArray(incident.analysis_results) ? incident.analysis_results[0] : null
      return {
        ...incident,
        root_cause: latest?.root_cause ?? null,
        severity: latest?.severity ?? null,
        confidence_score: latest?.confidence_score ?? null,
        root_cause_service: latest?.root_cause_service ?? null,
      }
    })
  } catch (err) {
    console.error('[DB] fetchIncidentHistory error:', err.message)
    return []
  }
}

export async function fetchServiceTrend(serviceName) {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('created_at, confidence_score, severity')
      .eq('root_cause_service', serviceName)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('[DB] fetchServiceTrend error:', err.message)
    return []
  }
}

export async function getAnalysisById(analysisId) {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('id', analysisId)
      .maybeSingle()

    if (error) throw error
    return data || null
  } catch (err) {
    console.error('[DB] getAnalysisById error:', err.message)
    return null
  }
}

export async function getFullIncident(incidentId) {
  try {
    const { data: incident, error: incidentError } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', incidentId)
      .maybeSingle()

    if (incidentError) throw incidentError
    if (!incident) return null

    const { data: analyses, error: analysesError } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false })

    if (analysesError) throw analysesError

    return {
      ...incident,
      analysis_results: analyses || [],
      latest_analysis: (analyses || [])[0] || null,
    }
  } catch (err) {
    console.error('[DB] getFullIncident error:', err.message)
    throw err
  }
}

function normalizePostmortemRows(rows) {
  return (rows || []).map((row) => ({
    ...row,
    report_markdown: row.report_markdown ?? row.content ?? '',
    content: row.content ?? row.report_markdown ?? '',
  }))
}

export async function insertPostmortem(incidentIdOrPayload, analysisId, title, reportMarkdown) {
  const payload =
    typeof incidentIdOrPayload === 'object' && incidentIdOrPayload !== null
      ? incidentIdOrPayload
      : {
          incident_id: incidentIdOrPayload,
          analysis_id: analysisId,
          title,
          report_markdown: reportMarkdown,
        }

  try {
    const { data, error } = await supabase
      .from('postmortems')
      .insert({
        incident_id: payload.incident_id ?? null,
        analysis_id: payload.analysis_id ?? null,
        title: payload.title ?? null,
        report_markdown: payload.report_markdown ?? payload.content ?? '',
      })
      .select()
      .single()

    if (error) throw error
    return normalizePostmortemRows([data])[0]
  } catch (primaryErr) {
    try {
      const { data, error } = await supabase
        .from('postmortems')
        .insert({
          incident_id: payload.incident_id ?? null,
          title: payload.title ?? null,
          content: payload.report_markdown ?? payload.content ?? '',
        })
        .select()
        .single()

      if (error) throw error
      return normalizePostmortemRows([data])[0]
    } catch (fallbackErr) {
      console.error('[DB] insertPostmortem error:', fallbackErr.message)
      throw primaryErr
    }
  }
}

export async function fetchPostmortems(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('postmortems')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return normalizePostmortemRows(data || [])
  } catch (err) {
    console.error('[DB] fetchPostmortems error:', err.message)
    return []
  }
}

export const SQL_CREATE_INCIDENTS = `
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  scenario_name text,
  raw_logs text,
  log_line_count integer
);
`.trim()

export const SQL_CREATE_ANALYSIS_RESULTS = `
create table if not exists analysis_results (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  created_at timestamptz not null default now(),
  root_cause text,
  root_cause_service text,
  confidence_score integer,
  severity text,
  business_impact text,
  timeline jsonb,
  affected_services jsonb,
  cascade_chain jsonb,
  immediate_fix text,
  permanent_fix text,
  historical_match text,
  blast_radius jsonb,
  alternatives jsonb
);
`.trim()

export const SQL_CREATE_POSTMORTEMS = `
create table if not exists postmortems (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  analysis_id uuid references analysis_results(id) on delete set null,
  created_at timestamptz not null default now(),
  title text,
  report_markdown text
);
`.trim()

export async function fetchIncidentsByDate(days = 90) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabase.from('incidents').select('id, created_at, analysis_results(severity)').gte('created_at', since.toISOString()).order('created_at', { ascending: true });
    if (error) throw error;
    const severityRank = { P0: 3, P1: 2, P2: 1 };
    const byDate = {};
    for (const incident of data || []) {
      const date = incident.created_at.slice(0, 10);
      const severity = Array.isArray(incident.analysis_results) && incident.analysis_results[0]?.severity ? incident.analysis_results[0].severity : 'P2';
      if (!byDate[date]) byDate[date] = { date, count: 0, worstSeverity: 'P2' };
      byDate[date].count += 1;
      if ((severityRank[severity] || 0) > (severityRank[byDate[date].worstSeverity] || 0)) byDate[date].worstSeverity = severity;
    }
    return Object.values(byDate);
  } catch (err) { console.error('[DB] fetchIncidentsByDate error:', err.message); return []; }
}

export async function fetchRecentIncidentsForBriefing(limit = 20) {
  try {
    const { data, error } = await supabase.from('incidents').select('id, scenario_name, created_at, analysis_results(root_cause, root_cause_service, severity, business_impact, immediate_fix, cascade_chain)').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(inc => {
      const a = Array.isArray(inc.analysis_results) ? inc.analysis_results[0] : null;
      return { id: inc.id, scenario_name: inc.scenario_name, created_at: inc.created_at, root_cause: a?.root_cause ?? null, root_cause_service: a?.root_cause_service ?? null, severity: a?.severity ?? 'P2', business_impact: a?.business_impact ?? null, immediate_fix: a?.immediate_fix ?? null, cascade_chain: a?.cascade_chain ?? [] };
    });
  } catch (err) { console.error('[DB] fetchRecentIncidentsForBriefing error:', err.message); return []; }
}

export { supabase }

export function extractKeywords(text) {
  if (!text) return [];
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from', 'due', 'error', 'failed']);
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

export function determineFailureMode(text) {
  if (!text) return 'unknown';
  const t = text.toLowerCase();
  if (t.includes('oom') || t.includes('memory') || t.includes('heap') || t.includes('leak')) return 'memory';
  if (t.includes('timeout') || t.includes('timed out')) return 'timeout';
  if (t.includes('deploy') || t.includes('rollout') || t.includes('release')) return 'deployment';
  if (t.includes('connection') || t.includes('pool') || t.includes('refused') || t.includes('socket')) return 'connection';
  if (t.includes('auth') || t.includes('secret') || t.includes('token') || t.includes('jwt') || t.includes('credentials')) return 'auth';
  if (t.includes('disk') || t.includes('space') || t.includes('storage') || t.includes('exhaustion')) return 'disk';
  if (t.includes('cpu') || t.includes('spike') || t.includes('load') || t.includes('traffic')) return 'load';
  return 'unknown';
}

export function fetchIncidentDNA(analysis) {
  if (!analysis) return null;
  const rootCause = analysis.root_cause || analysis.rootCause || '';
  const rootCauseService = analysis.root_cause_service || analysis.rootCauseService || '';
  const affected = analysis.affected_services || analysis.affectedServices || [];
  const severity = analysis.severity || 'P2';

  return {
    failureMode: determineFailureMode(rootCause),
    rootCauseService,
    affectedServices: Array.isArray(affected) ? affected.map(s => s?.name || s) : [],
    severity,
    keywords: extractKeywords(rootCause),
    cascadeDepth: Array.isArray(analysis.cascade_chain || analysis.cascadeChain) ? (analysis.cascade_chain || analysis.cascadeChain).length : 0
  };
}

export async function fetchSimilarIncidents(rootCauseService, affectedServices, severity, excludeIncidentId, rootCauseText = '') {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('id, incident_id, root_cause, root_cause_service, severity, affected_services, immediate_fix, permanent_fix, created_at, incidents(scenario_name)')
      .neq('incident_id', excludeIncidentId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const currentKeywords = extractKeywords(rootCauseText);
    const currentMode = determineFailureMode(rootCauseText);

    const scored = (data || []).map(past => {
      let score = 0;
      const matchDetails = [];

      // 1. Root Cause Service (+25)
      if (past.root_cause_service === rootCauseService) {
        score += 25;
        matchDetails.push('service');
      }

      // 2. Severity (+10)
      if (past.severity === severity) {
        score += 10;
        matchDetails.push('severity');
      }

      // 3. Affected Services Overlap (+15 max)
      const pastServices = Array.isArray(past.affected_services) ? past.affected_services.map(s => s?.name || s) : [];
      const currServices = Array.isArray(affectedServices) ? affectedServices.map(s => s?.name || s) : [];
      const overlap = currServices.filter(s => pastServices.includes(s)).length;
      const union = new Set([...currServices, ...pastServices]).size;
      if (union > 0) {
        const topologyScore = Math.round((overlap / union) * 15);
        score += topologyScore;
        if (topologyScore > 5) matchDetails.push('topology');
      }

      // 4. Failure Mode (+10)
      const pastMode = determineFailureMode(past.root_cause);
      if (pastMode === currentMode && currentMode !== 'unknown') {
        score += 10;
        matchDetails.push('failure_mode');
      }

      // 5. Keyword Overlap (+40 max)
      const pastKeywords = extractKeywords(past.root_cause);
      const kwOverlap = currentKeywords.filter(k => pastKeywords.includes(k)).length;
      const kwUnion = new Set([...currentKeywords, ...pastKeywords]).size;
      if (kwUnion > 0) {
        const textScore = Math.round((kwOverlap / kwUnion) * 40);
        score += textScore;
        if (textScore > 10) matchDetails.push('keywords');
      }

      const scenario_name = Array.isArray(past.incidents) ? past.incidents[0]?.scenario_name : past.incidents?.scenario_name;

      return { 
        ...past, 
        similarityScore: score,
        matchDetails,
        scenario_name
      };
    })

    return scored
      .filter(p => p.similarityScore >= 30)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 5)
  } catch (err) {
    console.error('[DB] fetchSimilarIncidents error:', err.message)
    return []
  }
}
