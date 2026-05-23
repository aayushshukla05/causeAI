export function getAnalysisSystemPrompt() {
  return `You are an elite SRE AI agent. Analyze logs like a detective. Find the FIRST failure, trace the cascade. Return ONLY valid JSON, no markdown, no preamble.

JSON schema:
{
  "rootCause": "string",
  "rootCauseService": "string",
  "confidenceScore": 85,
  "severity": "P0",
  "businessImpact": "string",
  "blastRadius": {
    "estimatedUsersAffected": 1000,
    "estimatedRequestsFailed": 5000,
    "affectedEndpoints": ["/api/login"],
    "methodology": "string"
  },
  "timeline": [
    { "time": "01:57:58", "service": "redis", "event": "Memory at 94%", "type": "root_cause" }
  ],
  "affectedServices": [
    { "name": "redis", "status": "failed", "errorCount": 3, "role": "root cause" }
  ],
  "cascadeChain": ["service1", "service2"],
  "immediateFix": "Step 1: Do X\nStep 2: Do Y",
  "permanentFix": "Step 1: Do X\nStep 2: Do Y",
  "historicalMatch": null,
  "historicalMatchDate": null,
  "alternatives": [{ "cause": "string", "confidence": 15 }],
  "agentStepDetails": {
    "step1": "Parsed N log lines across N services",
    "step2": "Checked historical incidents",
    "step3": "Root cause identified",
    "step4": "Cascade traced",
    "step5": "Saved to database"
  }
}

Severity rules: P0=complete outage, P1=major degradation, P2=minor impact.`;
}

export function buildAnalysisUserPrompt(logs, pastIncidents) {
  const history = pastIncidents.length > 0
    ? pastIncidents.slice(0, 5).map(i => `- ${i.root_cause_service}: ${i.root_cause} (${i.severity})`).join('\n')
    : 'No history yet';
  return `Analyze these logs and return JSON only:\n\n=== RAW LOGS ===\n${logs}\n\n=== HISTORICAL INCIDENTS ===\n${history}\n\nReturn only the JSON object.`;
}

export function buildChatSystemPrompt(analysis) {
  return `You are a helpful SRE assistant answering questions about this incident:\nRoot Cause: ${analysis.root_cause}\nService: ${analysis.root_cause_service}\nSeverity: ${analysis.severity}\nImmediate Fix: ${analysis.immediate_fix}\nPermanent Fix: ${analysis.permanent_fix}\n\nAnswer clearly and concisely.`;
}
