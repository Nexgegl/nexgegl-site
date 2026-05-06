// =============================================================================
// NEXGEGL Audit Logger
// Append-only. Never updates or deletes rows. All governance actions flow here.
// =============================================================================

import { PoolClient } from "pg";
import { pool } from "./db";

export type AuditParams = {
  tenant_id: string;
  actor: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  before_state?: Record<string, unknown> | null;
  after_state?: Record<string, unknown> | null;
  reason?: string;
  ip_address?: string;
};

const INSERT_AUDIT = `
  INSERT INTO audit_log
    (tenant_id, actor, action, entity_type, entity_id, before_state, after_state, reason, ip_address)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`;

// Use this when outside a transaction (acquires its own connection).
export async function audit(params: AuditParams): Promise<void> {
  await pool.query(INSERT_AUDIT, [
    params.tenant_id,
    params.actor,
    params.action,
    params.entity_type ?? null,
    params.entity_id ?? null,
    params.before_state ? JSON.stringify(params.before_state) : null,
    params.after_state ? JSON.stringify(params.after_state) : null,
    params.reason ?? null,
    params.ip_address ?? null,
  ]);
}

// Use this inside an existing transaction so the audit entry is atomically
// committed or rolled back with the parent operation.
export async function auditTx(
  client: PoolClient,
  params: AuditParams
): Promise<void> {
  await client.query(INSERT_AUDIT, [
    params.tenant_id,
    params.actor,
    params.action,
    params.entity_type ?? null,
    params.entity_id ?? null,
    params.before_state ? JSON.stringify(params.before_state) : null,
    params.after_state ? JSON.stringify(params.after_state) : null,
    params.reason ?? null,
    params.ip_address ?? null,
  ]);
}

// ---------------------------------------------------------------------------
// Well-known action constants — prevents typos across the codebase
// ---------------------------------------------------------------------------

export const ACTIONS = {
  SIGNAL_INGESTED: "signal.ingested",
  SIGNAL_DUPLICATE: "signal.duplicate",
  ENTITY_CREATED: "entity.created",
  ENTITY_UPDATED: "entity.updated",
  QUALIFICATION_RUN_STARTED: "qualification.run.started",
  QUALIFICATION_RUN_COMPLETED: "qualification.run.completed",
  QUALIFICATION_RUN_FAILED: "qualification.run.failed",
  ACCOUNT_QUALIFIED: "account.qualified",
  QUALIFICATION_CREATED: "qualification.created",
  QUALIFICATION_APPROVED: "qualification.approved",
  QUALIFICATION_REJECTED: "qualification.rejected",
  QUALIFICATION_EXECUTED: "qualification.executed",
  QUALIFICATION_WITHDRAWN: "qualification.withdrawn",
  OUTBOUND_READY: "outbound.ready",
  OUTBOUND_DISPATCHED: "outbound.dispatched",
  OUTBOUND_FAILED: "outbound.failed",
} as const;

export type AuditAction = (typeof ACTIONS)[keyof typeof ACTIONS];
