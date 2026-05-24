import { supabase } from '../db/supabase.js'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

function randomHex(n) {
  return Math.random().toString(16).slice(2, 2 + n)
}

async function updateServiceStatus(service, status, lastAction) {
  await supabase.from('services')
    .update({ status, last_action: lastAction, last_action_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('name', service)
}

async function updateServiceMetrics(service, metrics) {
  await supabase.from('services')
    .update({ ...metrics, updated_at: new Date().toISOString() })
    .eq('name', service)
}

export async function flushCache(service, params = {}) {
  await updateServiceStatus(service, 'restarting', 'Flushing cache...')
  await sleep(2000)
  const keysRemoved = Math.floor(Math.random() * 15000) + 5000
  const memoryAfter = Math.floor(Math.random() * 20) + 55
  await updateServiceStatus(service, 'healthy', `Cache flushed — ${keysRemoved} keys removed`)
  await updateServiceMetrics(service, { memory_usage_pct: memoryAfter, cache_size_mb: 0 })
  return { success: true, service, keys_removed: keysRemoved, memory_before: '94%', memory_after: `${memoryAfter}%` }
}

export async function restartService(service, params = {}) {
  const duration = params.strategy === 'rolling' ? 8000 : 4000
  await updateServiceStatus(service, 'restarting', `${params.strategy || 'hard'} restart initiated`)
  await sleep(duration)
  const newPod = `${service}-${randomHex(4)}`
  await updateServiceStatus(service, 'healthy', `Restart complete — pod ${newPod} healthy`)
  await updateServiceMetrics(service, { error_rate_pct: 0.2 })
  return { success: true, service, strategy: params.strategy || 'hard', new_pod: newPod, health_check: 'passing' }
}

export async function scaleUp(service, params = {}) {
  const current = params.current_replicas || 2
  const target = params.target_replicas || 4
  await updateServiceStatus(service, 'scaling', `Scaling to ${target} replicas`)
  await sleep((target - current) * 3000)
  await updateServiceStatus(service, 'healthy', `Scaled to ${target} replicas`)
  await updateServiceMetrics(service, { replica_count: target, error_rate_pct: 0.3 })
  return { success: true, service, previous_replicas: current, current_replicas: target }
}

export async function killLongQueries(service, params = {}) {
  await updateServiceStatus(service, 'restarting', 'Killing long-running queries')
  await sleep(1500)
  const killed = Math.floor(Math.random() * 20) + 5
  await updateServiceStatus(service, 'healthy', `${killed} long queries killed`)
  await updateServiceMetrics(service, { error_rate_pct: 0.5 })
  return { success: true, service, queries_killed: killed }
}

export async function enableCircuitBreaker(service, params = {}) {
  await updateServiceStatus(service, 'restarting', 'Enabling circuit breaker')
  await sleep(1000)
  await supabase.from('services').update({ circuit_breaker_enabled: true }).eq('name', service)
  await updateServiceStatus(service, 'healthy', 'Circuit breaker enabled')
  return { success: true, service, circuit_breaker: 'enabled' }
}

export async function rollback(service, params = {}) {
  await updateServiceStatus(service, 'restarting', `Rolling back to ${params.version || 'previous version'}`)
  await sleep(6000)
  await updateServiceStatus(service, 'healthy', `Rollback complete`)
  await updateServiceMetrics(service, { error_rate_pct: 0.1 })
  return { success: true, service, version: params.version || 'v-prev' }
}

export function getToolByType(type) {
  const tools = {
    flush_cache: flushCache,
    restart_service: restartService,
    scale_up: scaleUp,
    kill_queries: killLongQueries,
    circuit_breaker: enableCircuitBreaker,
    rollback: rollback
  }
  return tools[type] || null
}
