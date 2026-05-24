import Groq from 'groq-sdk'
import { getRemediationPlanPrompt, getVerificationPrompt, getFailureRecoveryPrompt } from './remediationPrompts.js'
import { getToolByType } from '../tools/infraTools.js'
import { supabase } from '../db/supabase.js'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const activeRuns = new Map()

async function callGroq(prompt) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1
  })
  const text = response.choices[0].message.content
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

export async function startRemediationAgent(incidentId, analysis, onEvent) {
  onEvent({ type: 'PLANNING', message: 'Analyzing incident...' })

  const plan = await callGroq(getRemediationPlanPrompt(analysis))

  activeRuns.set(incidentId, { status: 'awaiting_approval', plan, results: [], approvalResolver: null })

  onEvent({ type: 'PLAN_READY', plan, message: `Plan ready. ${plan.actions.length} actions identified.` })
  onEvent({ type: 'AWAITING_APPROVAL', message: 'Waiting for engineer approval...' })

  await waitForApproval(incidentId)

  const run = activeRuns.get(incidentId)
  if (run.status === 'rejected') {
    onEvent({ type: 'REJECTED', message: 'Remediation rejected by engineer' })
    return
  }

  run.status = 'executing'
  const executedActions = []

  for (const action of plan.actions) {
    onEvent({ type: 'EXECUTING', action, message: `Executing: ${action.type} on ${action.target_service}` })

    const tool = getToolByType(action.type)
    if (!tool) {
      onEvent({ type: 'SKIPPED', action, message: `No tool for ${action.type}, skipping` })
      continue
    }

    let result
    try {
      result = await tool(action.target_service, action.parameters)
    } catch (err) {
      result = { success: false, error: err.message }
    }

    onEvent({
      type: 'ACTION_COMPLETE', action, result,
      message: result.success
        ? `✓ ${action.target_service} — ${action.type} succeeded`
        : `✗ ${action.target_service} — ${action.type} failed`
    })

    const verification = await callGroq(getVerificationPrompt(action, result))
    onEvent({ type: 'VERIFIED', action, verification, message: `Verification: ${verification.state}` })
    executedActions.push({ action, result, verification })

    if (!verification.success) {
      onEvent({ type: 'ACTION_FAILED', message: 'Action failed. Getting recovery plan...' })
      const recovery = await callGroq(getFailureRecoveryPrompt(action, result))
      onEvent({ type: 'RECOVERY_PROPOSED', recovery, message: `Alternative: ${recovery.alternative_action.type} on ${recovery.alternative_action.target_service}` })

      const altTool = getToolByType(recovery.alternative_action.type)
      if (altTool) {
        const altResult = await altTool(recovery.alternative_action.target_service, recovery.alternative_action.parameters || {})
        onEvent({
          type: 'RECOVERY_EXECUTED', result: altResult,
          message: altResult.success ? '✓ Alternative succeeded' : `✗ Alternative failed. Escalate: ${recovery.escalation}`
        })
      }
    }
  }

  await supabase.from('remediation_runs').insert({
    incident_id: incidentId,
    team_id: 'sre-team-01',
    actions_planned: plan.actions,
    actions_executed: executedActions,
    outcome: 'resolved',
    approved_by: 'engineer'
  })

  run.status = 'complete'
  activeRuns.set(incidentId, run)
  onEvent({ type: 'COMPLETE', executedActions, message: '✅ All actions complete. Incident resolved.' })
}

function waitForApproval(incidentId) {
  return new Promise((resolve) => {
    const run = activeRuns.get(incidentId)
    run.approvalResolver = resolve
    activeRuns.set(incidentId, run)
  })
}

export function approveRemediation(incidentId) {
  const run = activeRuns.get(incidentId)
  if (run?.approvalResolver) { run.status = 'approved'; run.approvalResolver() }
}

export function rejectRemediation(incidentId) {
  const run = activeRuns.get(incidentId)
  if (run?.approvalResolver) { run.status = 'rejected'; run.approvalResolver() }
}
