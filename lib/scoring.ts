// =============================================================================
// NEXGEGL Account Qualification Engine
//
// Deterministic. Rule-based. No ML, no randomness.
// Same inputs → same verdict, every time.
//
// Rules evaluated:
//   1. revenue_trend      — 3-period rolling average vs prior 3 periods
//   2. cost_efficiency    — cost / revenue ratio
//   3. complaint_rate     — complaint events per unit revenue
//   4. fulfillment_rate   — delivery success / total deliveries
//   5. momentum           — 3 consecutive improving or declining periods
//   6. signal_freshness   — staleness penalty if last signal > 30 days
//
// Verdict thresholds (on normalised confidence [0,1]):
//   >= 0.68  →  VERIFIED
//   <= 0.32  →  BLOCKED
//   else     →  REVIEW_REQUIRED
//   < 2 rules with data → LOW_CONFIDENCE
// =============================================================================

import { PoolClient } from "pg";
import { withTransaction } from "./db";
import { ACTIONS, auditTx } from "./audit";
import {
  CanonicalEntity,
  EntityScore,
  QualificationInput,
  QualificationOutput,
  RuleResult,
  ScoringRun,
  ScoringRunStatus,
  ScoringTrigger,
  Verdict,
} from "./types";

// ---------------------------------------------------------------------------
// Weights (positive = towards VERIFIED, negative = towards BLOCKED)
// These are invariants — changing them requires a documented ADR.
// ---------------------------------------------------------------------------

const WEIGHTS = {
  revenue_trend:    { positive: 0.30, negative: -0.30 },
  cost_efficiency:  { positive: 0.20, negative: -0.25 },
  complaint_rate:   { positive: 0.10, negative: -0.20 },
  fulfillment_rate: { positive: 0.15, negative: -0.20 },
  momentum:         { positive: 0.10, negative: -0.10 },
  signal_freshness: { positive: 0.00, negative: -0.10 },
} as const;

const MAX_RAW =
  WEIGHTS.revenue_trend.positive +
  WEIGHTS.cost_efficiency.positive +
  WEIGHTS.complaint_rate.positive +
  WEIGHTS.fulfillment_rate.positive +
  WEIGHTS.momentum.positive;

const MIN_RAW =
  WEIGHTS.revenue_trend.negative +
  WEIGHTS.cost_efficiency.negative +
  WEIGHTS.complaint_rate.negative +
  WEIGHTS.fulfillment_rate.negative +
  WEIGHTS.momentum.negative +
  WEIGHTS.signal_freshness.negative;

const SCORE_RANGE = MAX_RAW - MIN_RAW;

function normalise(raw: number): number {
  return Math.min(1, Math.max(0, (raw - MIN_RAW) / SCORE_RANGE));
}

const VERIFIED_THRESHOLD  = 0.68;
const BLOCKED_THRESHOLD   = 0.32;
const MIN_RULES_FOR_VERDICT = 2;

// ---------------------------------------------------------------------------
// Individual rule evaluators
// Each returns a RuleResult. fired=false means no data → weight = 0.
// ---------------------------------------------------------------------------

function ruleRevenueTrend(events: QualificationInput["events"]): RuleResult {
  const revenue = events
    .filter((e) => e.event_type === "revenue" && e.value != null && e.period_start)
    .sort((a, b) => (a.period_start! > b.period_start! ? 1 : -1));

  if (revenue.length < 4) {
    return { rule: "revenue_trend", fired: false, direction: "neutral", weight: 0, evidence: { count: revenue.length } };
  }

  const mid = Math.floor(revenue.length / 2);
  const prior = revenue.slice(0, mid).reduce((s, e) => s + e.value!, 0) / mid;
  const current = revenue.slice(mid).reduce((s, e) => s + e.value!, 0) / (revenue.length - mid);
  const growthPct = prior === 0 ? 0 : ((current - prior) / prior) * 100;

  const positive = growthPct > 10;
  const negative = growthPct < -10;

  return {
    rule: "revenue_trend",
    fired: positive || negative,
    direction: positive ? "positive" : negative ? "negative" : "neutral",
    weight: positive
      ? WEIGHTS.revenue_trend.positive
      : negative
      ? WEIGHTS.revenue_trend.negative
      : 0,
    evidence: { current_avg: current, prior_avg: prior, growth_pct: parseFloat(growthPct.toFixed(2)) },
  };
}

function ruleCostEfficiency(events: QualificationInput["events"]): RuleResult {
  const revenue = events.filter((e) => e.event_type === "revenue").reduce((s, e) => s + (e.value ?? 0), 0);
  const cost    = events.filter((e) => e.event_type === "cost").reduce((s, e) => s + (e.value ?? 0), 0);

  if (revenue === 0 || cost === 0) {
    return { rule: "cost_efficiency", fired: false, direction: "neutral", weight: 0, evidence: { revenue, cost } };
  }

  const ratio = cost / revenue;
  const positive = ratio < 0.60;
  const negative = ratio > 0.90;

  return {
    rule: "cost_efficiency",
    fired: positive || negative,
    direction: positive ? "positive" : negative ? "negative" : "neutral",
    weight: positive
      ? WEIGHTS.cost_efficiency.positive
      : negative
      ? WEIGHTS.cost_efficiency.negative
      : 0,
    evidence: { cost_ratio: parseFloat(ratio.toFixed(4)), revenue, cost },
  };
}

function ruleComplaintRate(events: QualificationInput["events"]): RuleResult {
  const complaints = events.filter((e) => e.event_type === "complaint").length;
  const revenue = events.filter((e) => e.event_type === "revenue").reduce((s, e) => s + (e.value ?? 0), 0);

  if (complaints === 0) {
    return { rule: "complaint_rate", fired: false, direction: "neutral", weight: 0, evidence: { complaints, revenue } };
  }

  const rate = revenue > 0 ? complaints / (revenue / 100_000) : complaints;
  const negative = rate > 1.0;
  const positive = rate < 0.1;

  return {
    rule: "complaint_rate",
    fired: positive || negative,
    direction: positive ? "positive" : negative ? "negative" : "neutral",
    weight: positive
      ? WEIGHTS.complaint_rate.positive
      : negative
      ? WEIGHTS.complaint_rate.negative
      : 0,
    evidence: { rate: parseFloat(rate.toFixed(4)), complaints, revenue },
  };
}

function ruleFulfillmentRate(events: QualificationInput["events"]): RuleResult {
  const deliveries = events.filter((e) => e.event_type === "delivery_success").length;
  const failures   = events.filter((e) => e.event_type === "delivery_failure").length;
  const total      = deliveries + failures;

  if (total === 0) {
    return { rule: "fulfillment_rate", fired: false, direction: "neutral", weight: 0, evidence: { total } };
  }

  const rate = deliveries / total;
  const positive = rate >= 0.95;
  const negative = rate < 0.80;

  return {
    rule: "fulfillment_rate",
    fired: positive || negative,
    direction: positive ? "positive" : negative ? "negative" : "neutral",
    weight: positive
      ? WEIGHTS.fulfillment_rate.positive
      : negative
      ? WEIGHTS.fulfillment_rate.negative
      : 0,
    evidence: { rate: parseFloat(rate.toFixed(4)), deliveries, failures, total },
  };
}

function ruleMomentum(events: QualificationInput["events"]): RuleResult {
  const revenue = events
    .filter((e) => e.event_type === "revenue" && e.value != null && e.period_start)
    .sort((a, b) => (a.period_start! > b.period_start! ? 1 : -1));

  if (revenue.length < 3) {
    return { rule: "momentum", fired: false, direction: "neutral", weight: 0, evidence: { periods: revenue.length } };
  }

  const last3 = revenue.slice(-3).map((e) => e.value!);
  const improving = last3[0] < last3[1] && last3[1] < last3[2];
  const declining = last3[0] > last3[1] && last3[1] > last3[2];

  return {
    rule: "momentum",
    fired: improving || declining,
    direction: improving ? "positive" : declining ? "negative" : "neutral",
    weight: improving
      ? WEIGHTS.momentum.positive
      : declining
      ? WEIGHTS.momentum.negative
      : 0,
    evidence: { last_3_periods: last3 },
  };
}

function ruleSignalFreshness(events: QualificationInput["events"]): RuleResult {
  if (events.length === 0) {
    return { rule: "signal_freshness", fired: true, direction: "negative", weight: WEIGHTS.signal_freshness.negative, evidence: { days_since_last: null } };
  }

  const latest = events.reduce((max, e) => {
    const t = new Date(e.occurred_at).getTime();
    return t > max ? t : max;
  }, 0);

  const daysSince = (Date.now() - latest) / (1000 * 60 * 60 * 24);
  const stale = daysSince > 30;

  return {
    rule: "signal_freshness",
    fired: stale,
    direction: stale ? "negative" : "neutral",
    weight: stale ? WEIGHTS.signal_freshness.negative : 0,
    evidence: { days_since_last: parseFloat(daysSince.toFixed(1)) },
  };
}

// ---------------------------------------------------------------------------
// Core qualification function — pure, side-effect-free
// ---------------------------------------------------------------------------

export function qualifyAccount(input: QualificationInput): QualificationOutput {
  const rules: RuleResult[] = [
    ruleRevenueTrend(input.events),
    ruleCostEfficiency(input.events),
    ruleComplaintRate(input.events),
    ruleFulfillmentRate(input.events),
    ruleMomentum(input.events),
    ruleSignalFreshness(input.events),
  ];

  const rawScore = rules.reduce((sum, r) => sum + r.weight, 0);
  const confidence = normalise(rawScore);
  const rulesWithData = rules.filter((r) => r.fired || r.direction !== "neutral").length;

  let verdict: Verdict;
  if (rulesWithData < MIN_RULES_FOR_VERDICT) {
    verdict = "low_confidence";
  } else if (confidence >= VERIFIED_THRESHOLD) {
    verdict = "verified";
  } else if (confidence <= BLOCKED_THRESHOLD) {
    verdict = "blocked";
  } else {
    verdict = "review_required";
  }

  return { verdict, confidence: parseFloat(confidence.toFixed(6)), rule_trace: rules };
}

// ---------------------------------------------------------------------------
// Run qualification for all active entities of a tenant
// ---------------------------------------------------------------------------

export async function runQualificationForTenant(
  tenantId: string,
  triggeredBy: ScoringTrigger = "manual",
  actor: string = "system"
): Promise<ScoringRun> {
  return withTransaction(async (client) => {
    const runRes = await client.query<ScoringRun>(
      `INSERT INTO scoring_runs (tenant_id, triggered_by, actor, status)
       VALUES ($1, $2, $3, 'running') RETURNING *`,
      [tenantId, triggeredBy, actor]
    );
    const run = runRes.rows[0];

    await auditTx(client, {
      tenant_id: tenantId,
      actor,
      action: ACTIONS.QUALIFICATION_RUN_STARTED,
      entity_id: run.id,
      entity_type: "qualification_run",
    });

    let entityCount = 0;
    let status: ScoringRunStatus = "completed";

    try {
      const entities = await client.query<CanonicalEntity>(
        `SELECT * FROM canonical_entities WHERE tenant_id = $1 AND is_active = true`,
        [tenantId]
      );

      for (const entity of entities.rows) {
        const eventsRes = await client.query(
          `SELECT * FROM signal_events
           WHERE entity_id = $1 AND occurred_at >= now() - INTERVAL '90 days'
           ORDER BY occurred_at ASC`,
          [entity.id]
        );

        const output = qualifyAccount({ entity, events: eventsRes.rows });

        const scoreRes = await client.query<EntityScore>(
          `INSERT INTO entity_scores (tenant_id, run_id, entity_id, verdict, confidence, rule_trace)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            tenantId,
            run.id,
            entity.id,
            output.verdict,
            output.confidence,
            JSON.stringify(output.rule_trace),
          ]
        );

        await auditTx(client, {
          tenant_id: tenantId,
          actor,
          action: ACTIONS.ACCOUNT_QUALIFIED,
          entity_type: entity.entity_type,
          entity_id: entity.id,
          after_state: {
            verdict: output.verdict,
            confidence: output.confidence,
            score_id: scoreRes.rows[0].id,
          },
        });

        entityCount++;
      }
    } catch (err) {
      status = "failed";
      await auditTx(client, {
        tenant_id: tenantId,
        actor,
        action: ACTIONS.QUALIFICATION_RUN_FAILED,
        entity_id: run.id,
        entity_type: "qualification_run",
        reason: err instanceof Error ? err.message : "unknown",
      });
    }

    const finalRes = await client.query<ScoringRun>(
      `UPDATE scoring_runs
       SET status = $1, completed_at = now(), entity_count = $2
       WHERE id = $3 RETURNING *`,
      [status, entityCount, run.id]
    );

    if (status === "completed") {
      await auditTx(client, {
        tenant_id: tenantId,
        actor,
        action: ACTIONS.QUALIFICATION_RUN_COMPLETED,
        entity_id: run.id,
        entity_type: "qualification_run",
        after_state: { entity_count: entityCount },
      });
    }

    return finalRes.rows[0];
  });
}

// ---------------------------------------------------------------------------
// Aggregate qualification counts — used by the exec-counts API
// ---------------------------------------------------------------------------

export async function getQualificationCounts(
  client: PoolClient,
  tenantId: string
): Promise<{ verified: number; review_required: number; blocked: number }> {
  const result = await client.query<{ verdict: string; count: string }>(
    `
    SELECT es.verdict, COUNT(*) AS count
    FROM entity_scores es
    INNER JOIN scoring_runs sr ON sr.id = es.run_id
    WHERE es.tenant_id = $1
      AND sr.id = (
        SELECT id FROM scoring_runs
        WHERE tenant_id = $1 AND status = 'completed'
        ORDER BY completed_at DESC
        LIMIT 1
      )
    GROUP BY es.verdict
    `,
    [tenantId]
  );

  const counts = { verified: 0, review_required: 0, blocked: 0 };
  for (const row of result.rows) {
    if (row.verdict === "verified")        counts.verified        = parseInt(row.count, 10);
    else if (row.verdict === "review_required") counts.review_required = parseInt(row.count, 10);
    else if (row.verdict === "blocked")    counts.blocked         = parseInt(row.count, 10);
  }
  return counts;
}
