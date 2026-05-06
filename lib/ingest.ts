// =============================================================================
// NEXGEGL Ingestion Pipeline
// Entry point for all external data arriving from connected sources.
// Each record is fingerprinted, deduped, and linked to a canonical entity.
// Every step is wrapped in a transaction and written to the audit log.
// =============================================================================

import { PoolClient } from "pg";
import { withTransaction } from "./db";
import { ACTIONS, auditTx } from "./audit";
import {
  computeFingerprint,
  insertRawSignal,
  upsertCanonicalEntity,
  insertSignalEvent,
} from "./dedup";
import { DataSource, IngestPayload, IngestResult } from "./types";

// ---------------------------------------------------------------------------
// Validate that the source belongs to the tenant before accepting data.
// ---------------------------------------------------------------------------

async function fetchDataSource(
  client: PoolClient,
  sourceId: string,
  tenantId: string
): Promise<DataSource | null> {
  const result = await client.query<DataSource>(
    `SELECT * FROM data_sources WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
    [sourceId, tenantId]
  );
  return result.rows[0] ?? null;
}

async function touchDataSource(
  client: PoolClient,
  sourceId: string
): Promise<void> {
  await client.query(
    `UPDATE data_sources SET last_ingested_at = now() WHERE id = $1`,
    [sourceId]
  );
}

// ---------------------------------------------------------------------------
// ingest — processes a full IngestPayload inside one transaction per record.
// We isolate each record so a single bad row doesn't roll back the whole batch.
// ---------------------------------------------------------------------------

export async function ingest(
  payload: IngestPayload,
  actor: string = "system",
  ipAddress?: string
): Promise<IngestResult> {
  const result: IngestResult = { accepted: 0, duplicates: 0, errors: [] };

  // Validate source once before the loop (shared transaction-free check).
  const source = await withTransaction(async (client) => {
    const src = await fetchDataSource(client, payload.source_id, payload.tenant_id);
    if (!src) throw new Error("data_source not found or inactive");
    return src;
  });

  for (const record of payload.records) {
    try {
      await withTransaction(async (client) => {
        let accepted = 0;

        for (const event of record.events) {
          const fingerprint = computeFingerprint(
            payload.tenant_id,
            payload.source_id,
            record,
            event
          );

          const status = await insertRawSignal(client, {
            tenant_id: payload.tenant_id,
            source_id: payload.source_id,
            source_type: source.source_type,
            payload: { record: { external_id: record.external_id, entity_type: record.entity_type }, event },
            fingerprint,
          });

          if (status === "duplicate") {
            result.duplicates++;
            await auditTx(client, {
              tenant_id: payload.tenant_id,
              actor,
              action: ACTIONS.SIGNAL_DUPLICATE,
              entity_type: record.entity_type,
              reason: `fingerprint=${fingerprint}`,
              ip_address: ipAddress,
            });
            continue;
          }

          // Fetch the raw_signal id we just inserted.
          const sigRow = await client.query<{ id: string }>(
            `SELECT id FROM raw_signals WHERE tenant_id=$1 AND fingerprint=$2`,
            [payload.tenant_id, fingerprint]
          );
          const rawSignalId = sigRow.rows[0].id;

          const entityId = await upsertCanonicalEntity(client, {
            tenant_id: payload.tenant_id,
            entity_type: record.entity_type,
            external_id: record.external_id,
            name: record.name,
            metadata: record.metadata ?? {},
          });

          await insertSignalEvent(client, {
            tenant_id: payload.tenant_id,
            entity_id: entityId,
            source_id: payload.source_id,
            raw_signal_id: rawSignalId,
            event_type: event.event_type,
            value: event.value ?? null,
            unit: event.unit ?? null,
            period_start: event.period_start ?? null,
            period_end: event.period_end ?? null,
            occurred_at: event.occurred_at,
            metadata: event.metadata ?? {},
          });

          await auditTx(client, {
            tenant_id: payload.tenant_id,
            actor,
            action: ACTIONS.SIGNAL_INGESTED,
            entity_type: record.entity_type,
            entity_id: entityId,
            after_state: {
              fingerprint,
              event_type: event.event_type,
              period_start: event.period_start,
              period_end: event.period_end,
            },
            ip_address: ipAddress,
          });

          accepted++;
        }

        if (accepted > 0) {
          result.accepted += accepted;
          await touchDataSource(client, payload.source_id);
        }
      });
    } catch (err) {
      result.errors.push({
        external_id: record.external_id,
        reason: err instanceof Error ? err.message : "unknown error",
      });
    }
  }

  return result;
}
