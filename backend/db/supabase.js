import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export async function insertIncident(rawLogs, scenarioName) {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .insert({ raw_logs: rawLogs, scenario_name: scenarioName, log_line_count: rawLogs.split('\n').length })
      .select().single()
    if (error) throw error
    return data
  } catch (err) { console.error('[DB] insertIncident error:', err.message); throw err }
}

export async function insertAnalysisResult(incidentId, a) {
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
        alternatives: a.alternatives
      })
      .select().single()
    if (error) throw error
    return data
  } catch (err) { console.error('[DB] insertAnalysisResult error:', err.message); throw err }
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
  } catch (err) { console.error('[DB] fetchRecentAnalyses error:', err.message); return [] }
}

export async function fetchIncidentHistory(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('id, scenario_name, created_at, analysis_results(root_cause, severity, confidence_score, root_cause_service)')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (err) { console.error('[DB] fetchIncidentHistory error:', err.message); return [] }
}

export async function insertPostmortem({ incident_id, title, content }) {
  try {
    const { data, error } = await supabase
      .from('postmortems')
      .insert({ incident_id, title, content })
      .select().single()
    if (error) throw error
    return data
  } catch (err) { console.error('[DB] insertPostmortem error:', err.message); throw err }
}

export async function fetchPostmortems(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('postmortems')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (err) { console.error('[DB] fetchPostmortems error:', err.message); return [] }
}
