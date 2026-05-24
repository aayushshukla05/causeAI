import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const SCENARIOS = [
  { scenario_name: 'Redis OOM Cascade', root_cause: 'Redis memory exhaustion triggered auth fallback storm', root_cause_service: 'redis', severity: 'P0', business_impact: 'Complete checkout failure for all users', cascade_chain: ['redis', 'auth-service', 'checkout-service', 'api-gateway'] },
  { scenario_name: 'Bad Deployment', root_cause: 'NullPointerException in payment-service v2.3.2', root_cause_service: 'payment-service', severity: 'P0', business_impact: '94% payment failure rate', cascade_chain: ['payment-service', 'order-service', 'api-gateway'] },
  { scenario_name: 'Traffic Spike', root_cause: 'Unplanned 5x traffic surge overwhelmed product-service', root_cause_service: 'product-service', severity: 'P1', business_impact: 'Homepage 67% error rate', cascade_chain: ['load-balancer', 'product-service', 'frontend'] },
  { scenario_name: 'DB Pool Exhaustion', root_cause: 'worker-service held 34 idle Postgres connections', root_cause_service: 'postgres', severity: 'P0', business_impact: 'All data services starved of DB connections', cascade_chain: ['postgres', 'user-service', 'product-service', 'api-gateway'] },
  { scenario_name: 'Memory Leak', root_cause: 'Gradual heap growth caused OOMKilled pod', root_cause_service: 'api-service', severity: 'P1', business_impact: 'api-service unavailable for 8 minutes', cascade_chain: ['api-service', 'load-balancer'] },
  { scenario_name: 'Stripe Outage', root_cause: 'Stripe partial outage opened circuit breaker', root_cause_service: 'payment-service', severity: 'P1', business_impact: 'Checkout blocked globally', cascade_chain: ['payment-service', 'checkout-service', 'api-gateway'] },
  { scenario_name: 'CrashLoopBackOff', root_cause: 'Missing JWT_SECRET caused auth pods to crash', root_cause_service: 'auth-service', severity: 'P0', business_impact: '100% authentication failure', cascade_chain: ['auth-service', 'api-gateway'] },
  { scenario_name: 'Disk Exhaustion', root_cause: 'WAL archiving disabled caused Postgres disk to fill', root_cause_service: 'postgres', severity: 'P0', business_impact: 'Complete platform outage', cascade_chain: ['postgres', 'user-service', 'order-service', 'api-gateway'] },
];

function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(randomBetween(0, 23), randomBetween(0, 59), 0, 0);
  return d.toISOString();
}

async function seed() {
  console.log('Seeding incidents...');
  let inserted = 0;
  const plan = [];
  for (let day = 0; day <= 30; day += randomBetween(1, 3)) plan.push({ daysBack: day, scenario: SCENARIOS[randomBetween(0, 7)] });
  for (let day = 31; day <= 60; day += randomBetween(2, 5)) plan.push({ daysBack: day, scenario: SCENARIOS[randomBetween(0, 7)] });
  for (let day = 61; day <= 90; day += randomBetween(4, 8)) plan.push({ daysBack: day, scenario: SCENARIOS[randomBetween(0, 7)] });

  for (const { daysBack, scenario } of plan) {
    const createdAt = daysAgo(daysBack);
    const { data: incident, error: e1 } = await supabase.from('incidents').insert({ scenario_name: scenario.scenario_name, raw_logs: '[SEEDED]', log_line_count: randomBetween(8, 24), created_at: createdAt }).select().single();
    if (e1) { console.log('✗', e1.message); continue; }
    const { error: e2 } = await supabase.from('analysis_results').insert({ incident_id: incident.id, root_cause: scenario.root_cause, root_cause_service: scenario.root_cause_service, confidence_score: randomBetween(72, 97), severity: scenario.severity, business_impact: scenario.business_impact, cascade_chain: scenario.cascade_chain, timeline: [], affected_services: [], blast_radius: { estimatedUsersAffected: randomBetween(100, 12000), estimatedRequestsFailed: randomBetween(50, 5000) }, alternatives: [], created_at: createdAt });
    if (e2) { console.log('✗', e2.message); continue; }
    console.log(`✓ [${createdAt.slice(0,10)}] ${scenario.severity} ${scenario.scenario_name}`);
    inserted++;
  }
  console.log(`\nDone. Inserted: ${inserted}`);
}

seed().catch(err => { console.error(err.message); process.exit(1); });
