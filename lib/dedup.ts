// =============================================================================
// NEXGEGL Deduplication Engine
// Deterministic SHA-256 fingerprint per signal. Idempotent upsert.
// The DB unique index on (tenant_id, fingerprint) is the authoritative guard.
// =============================================================================

import { createHash } from "crypto";
import { PoolClient } from "pg";
import { IngestEvent, IngestRecord } from "./types";

// ---------------------------------------------------------------------------
// Fingerprint
// Canonical fields: tenant + source + entity external_id + event_type + period.
// Same business event always produces the same fingerprint regardless of when
// it arrives. Order of fields is fixed — do not change without a migration.
// ---------------------------------------------------------------------------

export function computeFingerprint(
  tenantId: string,
  sourceId: string,
  record: IngestRecord,
  event: IngestEvent
): string {
  const canonical = [
    tenantId,
    sourceId,
    record.entity_type,
    record.external_id,
    event.event_type,
    event.period_start ?? "",
    event.period_end ?? "",
    event.occurred_at,
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
}

// ---------------------------------------------------------------------------
// Insert raw signal, honouring the unique index for dedup.
// Returns 'accepted' | 'duplicate'.
// Must be called inside a transaction.
// ---------------------------------------------------------------------------

export async function insertRawSignal(
  client: PoolClient,
  params: {
    tenant_id: string;
    source_id: string;
    source_type: string;
    payload: Record<string, unknown>;
    fingerprint: string;
  }
): Promise<"accepted" | "duplicate"> {
  const result = await client.query<{ id: string; dedup_status: string }>(
    `
    INSERT INTO raw_signals (tenant_id, source_id, source_type, payload, fingerprint, dedup_status)
    VALUES ($1, $2, $3, $4, $5, 'accepted')
    ON CONFLICT (tenant_id, fingerprint) DO UPDATE
      SET dedup_status = 'duplicate'
    RETURNING id, dedup_status
    `,
    [
      params.tenant_id,
      params.source_id,
      params.source_type,
      JSON.stringify(params.payload),
      params.fingerprint,
    ]
  );

  return result.rows[0]?.dedup_status === "accepted" ? "accepted" : "duplicate";
}

// ---------------------------------------------------------------------------
// Upsert canonical entity — returns the entity id.
// Must be called inside a transaction.
// ---------------------------------------------------------------------------

export async function upsertCanonicalEntity(
  client: PoolClient,
  params: {
    tenant_id: string;
    entity_type: string;
    external_id: string;
    name: string;
    metadata: Record<string, unknown>;
  }
): Promise<string> {
  const result = await client.query<{ id: string }>(
    `
    INSERT INTO canonical_entities (tenant_id, entity_type, external_id, name, metadata)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (tenant_id, entity_type, external_id) DO UPDATE
      SET name       = EXCLUDED.name,
          metadata   = EXCLUDED.metadata,
          updated_at = now()
    RETURNING id
    `,
    [
      params.tenant_id,
      params.entity_type,
      params.external_id,
      params.name,
      JSON.stringify(params.metadata),
    ]
  );

  return result.rows[0].id;
}

// ---------------------------------------------------------------------------
// Insert signal event — idempotent via the raw_signal_id foreign key.
// Must be called inside a transaction.
// ---------------------------------------------------------------------------

export async function insertSignalEvent(
  client: PoolClient,
  params: {
    tenant_id: string;
    entity_id: string;
    source_id: string;
    raw_signal_id: string;
    event_type: string;
    value: number | null;
    unit: string | null;
    period_start: string | null;
    period_end: string | null;
    occurred_at: string;
    metadata: Record<string, unknown>;
  }
): Promise<void> {
  await client.query(
    `
    INSERT INTO signal_events
      (tenant_id, entity_id, source_id, raw_signal_id, event_type, value, unit,
       period_start, period_end, occurred_at, metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `,
    [
      params.tenant_id,
      params.entity_id,
      params.source_id,
      params.raw_signal_id,
      params.event_type,
      params.value ?? null,
      params.unit ?? null,
      params.period_start ?? null,
      params.period_end ?? null,
      params.occurred_at,
      JSON.stringify(params.metadata),
    ]
  );
}
