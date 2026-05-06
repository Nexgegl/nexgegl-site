// =============================================================================
// NEXGEGL Outbound Readiness Engine
//
// An entity reaches outbound-ready status only when ALL checks pass:
//   1. confidence_threshold — latest score.confidence >= 0.75
//   2. verdict_consistency  — last 2 scoring runs agree on the same verdict
//   3. pdpl_consent         — tenant has recorded PDPL consent
//   4. approval_gate        — enterprise tenants require explicit human approval
//
// Readiness is evaluated after every scoring run, not on demand.
// =============================================================================

import { withTransaction } from "./db";
import { ACTIONS, auditTx } from "./audit";
import { DecisionVerdict, ReadinessChecks, Verdict } from "./types";

const CONFIDENCE_THRESHOLD = 0.75;
const CONSISTENCY_REQUIRED  = 2;

// ---------------------------------------------------------------------------
// evaluateReadiness — runs after a scoring run completes
// Creates or updates outbound_queue entries for all entities in the run.
// ---------------------------------------------------------------------------

export async function evaluateReadinessForRun(
  runId: string,
  tenantId: string,
  actor: string = "system"
): Promise<void> {
  await withTransaction(async (client) => {
    // 1. Fetch tenant to check PDPL consent and tier
    const tenantRes = await client.query<{
      tier: string;
      pdpl_consent_recorded_at: Date | null;
    }>(`SELECT tier, pdpl_consent_recorded_at FROM tenants WHERE id = $1`, [tenantId]);

    const tenant = tenantRes.rows[0];
    if (!tenant) return;

    const pdplConsentOk = tenant.pdpl_consent_recorded_at !== null;

    // 2. Fetch all scores from this run
    const scoresRes = await client.query<{
      id: string;
      entity_id: string;
      verdict: Verdict;
      confidence: number;
    }>(
      `SELECT id, entity_id, verdict, confidence FROM entity_scores WHERE run_id = $1 AND tenant_id = $2`,
      [runId, tenantId]
    );

    for (const score of scoresRes.rows) {
      // Skip non-actionable verdicts
      if (score.verdict === "low_confidence") continue;

      // 3. Confidence check
      const confidenceOk = score.confidence >= CONFIDENCE_THRESHOLD;

      // 4. Consistency check — last N scores for this entity share the same verdict
      const historyRes = await client.query<{ verdict: Verdict }>(
        `SELECT es.verdict
         FROM entity_scores es
         INNER JOIN scoring_runs sr ON sr.id = es.run_id
         WHERE es.entity_id = $1
           AND sr.tenant_id = $2
           AND sr.status = 'completed'
         ORDER BY sr.completed_at DESC
         LIMIT $3`,
        [score.entity_id, tenantId, CONSISTENCY_REQUIRED]
      );

      const history = historyRes.rows.map((r) => r.verdict);
      const verdictConsistent =
        history.length >= CONSISTENCY_REQUIRED &&
        history.every((v) => v === score.verdict);

      // 5. Approval gate (enterprise always requires approval)
      const requiresApproval = tenant.tier === "enterprise";

      // Look for an existing approved decision for this entity + verdict
      const decisionRes = await client.query<{
        id: string;
        status: string;
        requires_approval: boolean;
      }>(
        `SELECT id, status, requires_approval
         FROM decisions
         WHERE entity_id = $1 AND tenant_id = $2 AND verdict = $3
         ORDER BY created_at DESC
         LIMIT 1`,
        [score.entity_id, tenantId, score.verdict]
      );

      const existingDecision = decisionRes.rows[0];
      const approvalPassed = requiresApproval
        ? existingDecision?.status === "approved"
        : true;

      const checks: ReadinessChecks = {
        confidence_threshold: {
          passed: confidenceOk,
          value: score.confidence,
          threshold: CONFIDENCE_THRESHOLD,
        },
        verdict_consistency: {
          passed: verdictConsistent,
          consecutive_matches: history.length,
          required: CONSISTENCY_REQUIRED,
        },
        pdpl_consent: { passed: pdplConsentOk },
        approval_gate: {
          passed: approvalPassed,
          requires_approval: requiresApproval,
          approved: approvalPassed,
        },
      };

      const isReady =
        confidenceOk && verdictConsistent && pdplConsentOk && approvalPassed;

      // 6. Ensure a decision record exists for this entity+verdict
      let decisionId: string;
      if (existingDecision) {
        decisionId = existingDecision.id;
      } else {
        const decisionInsert = await client.query<{ id: string }>(
          `INSERT INTO decisions
             (tenant_id, entity_id, score_id, verdict, status, requires_approval)
           VALUES ($1, $2, $3, $4, 'pending', $5)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [
            tenantId,
            score.entity_id,
            score.id,
            score.verdict as DecisionVerdict,
            requiresApproval,
          ]
        );

        if (decisionInsert.rows.length === 0) {
          // Another run won the race — re-fetch
          const refetch = await client.query<{ id: string }>(
            `SELECT id FROM decisions WHERE entity_id=$1 AND tenant_id=$2 AND verdict=$3 ORDER BY created_at DESC LIMIT 1`,
            [score.entity_id, tenantId, score.verdict]
          );
          decisionId = refetch.rows[0].id;
        } else {
          decisionId = decisionInsert.rows[0].id;
          await auditTx(client, {
            tenant_id: tenantId,
            actor,
            action: ACTIONS.QUALIFICATION_CREATED,
            entity_type: "qualification",
            entity_id: decisionId,
            after_state: { verdict: score.verdict, requires_approval: requiresApproval },
          });
        }
      }

      // 7. Upsert outbound_queue entry
      await client.query(
        `INSERT INTO outbound_queue
           (tenant_id, decision_id, readiness_checks, is_ready, ready_at, dispatch_status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (decision_id) DO UPDATE
           SET readiness_checks = EXCLUDED.readiness_checks,
               is_ready         = EXCLUDED.is_ready,
               ready_at         = EXCLUDED.ready_at,
               dispatch_status  = COALESCE(outbound_queue.dispatch_status, EXCLUDED.dispatch_status)`,
        [
          tenantId,
          decisionId,
          JSON.stringify(checks),
          isReady,
          isReady ? new Date().toISOString() : null,
          isReady ? "queued" : null,
        ]
      );

      if (isReady) {
        await auditTx(client, {
          tenant_id: tenantId,
          actor,
          action: ACTIONS.OUTBOUND_READY,
          entity_type: "qualification",
          entity_id: decisionId,
          after_state: { verdict: score.verdict, confidence: score.confidence },
        });
      }
    }
  });
}
