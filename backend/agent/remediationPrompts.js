export function getRemediationPlanPrompt(analysis) {
  return `You are an autonomous SRE remediation agent.
Given this incident analysis, produce exactly 3 remediation actions in priority order.

Rules:
- Action 1 must target the ROOT CAUSE service
- Action 2 must address the most critically affected downstream service
- Action 3 must be a verification or stabilization step
- Risk level must reflect actual impact of the action itself

Incident analysis:
${JSON.stringify(analysis, null, 2)}

Return ONLY valid JSON, no explanation, no markdown:
{
  "actions": [
    {
      "id": "action_1",
      "type": "restart_service|scale_up|rollback|flush_cache|kill_queries|circuit_breaker",
      "target_service": "service-name",
      "parameters": {},
      "reason": "why this action",
      "expected_outcome": "what should happen",
      "risk_level": "low|medium|high",
      "estimated_duration_seconds": 30
    }
  ],
  "overall_strategy": "one sentence plan",
  "estimated_resolution_minutes": 5,
  "confidence": 85
}`
}

export function getVerificationPrompt(action, result) {
  return `An SRE remediation action was just executed.

Action: ${JSON.stringify(action, null, 2)}
Result: ${JSON.stringify(result, null, 2)}

Did this action succeed? Return ONLY valid JSON:
{
  "success": true,
  "confidence": 90,
  "state": "current system state description",
  "next_recommendation": "what to do next"
}`
}

export function getFailureRecoveryPrompt(action, error) {
  return `An SRE remediation action FAILED.

Failed action: ${JSON.stringify(action, null, 2)}
Error: ${JSON.stringify(error, null, 2)}

Propose an alternative. Return ONLY valid JSON:
{
  "alternative_action": {
    "type": "restart_service|scale_up|rollback|flush_cache|kill_queries|circuit_breaker",
    "target_service": "service-name",
    "parameters": {},
    "reason": "why this alternative"
  },
  "escalation": "what to do if alternative also fails"
}`
}
