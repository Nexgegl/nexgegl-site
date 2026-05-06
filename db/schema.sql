-- =============================================================================
-- NEXGEGL Canonical Schema
-- Governance-first. Deterministic. Append-only audit trail.
-- Every table is tenant-scoped. No UPDATE/DELETE on audit_log.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. TENANTS — client organisations (PDPL data sovereignty unit)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                     TEXT        NOT NULL UNIQUE,
  name                     TEXT        NOT NULL,
  tier                     TEXT        NOT NULL DEFAULT 'standard'
                                       CHECK (tier IN ('standard', 'enterprise')),
  pdpl_consent_recorded_at TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. DATA SOURCES — connected systems per tenant
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sources (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  source_type      TEXT        NOT NULL
                               CHECK (source_type IN ('erp','crm','telematics','ads','sales','manual')),
  slug             TEXT        NOT NULL,
  connection_config JSONB      NOT NULL DEFAULT '{}',
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  last_ingested_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
CREATE INDEX IF NOT EXISTS data_sources_tenant_idx ON data_sources(tenant_id);

-- ---------------------------------------------------------------------------
-- 3. RAW SIGNALS — append-only ingest buffer
-- Fingerprint enforces deduplication at DB level.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_signals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  source_id   UUID        NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  source_type TEXT        NOT NULL,
  payload     JSONB       NOT NULL,
  fingerprint TEXT        NOT NULL,
  dedup_status TEXT       NOT NULL DEFAULT 'pending'
                          CHECK (dedup_status IN ('pending','accepted','duplicate')),
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS raw_signals_fingerprint_uidx
  ON raw_signals(tenant_id, fingerprint);
CREATE INDEX IF NOT EXISTS raw_signals_tenant_source_idx
  ON raw_signals(tenant_id, source_id);
CREATE INDEX IF NOT EXISTS raw_signals_ingested_at_idx
  ON raw_signals(ingested_at);

-- ---------------------------------------------------------------------------
-- 4. CANONICAL ENTITIES — deduplicated, normalised business objects
-- One row per (tenant, entity_type, external_id).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS canonical_entities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entity_type TEXT        NOT NULL
                          CHECK (entity_type IN ('product','campaign','route','asset','initiative','sku')),
  external_id TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity_type, external_id)
);
CREATE INDEX IF NOT EXISTS canonical_entities_tenant_type_idx
  ON canonical_entities(tenant_id, entity_type);

-- ---------------------------------------------------------------------------
-- 5. SIGNAL EVENTS — enriched events linked to canonical entities
-- These are the facts the scoring engine reads.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signal_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entity_id       UUID        NOT NULL REFERENCES canonical_entities(id) ON DELETE RESTRICT,
  source_id       UUID        NOT NULL REFERENCES data_sources(id) ON DELETE RESTRICT,
  raw_signal_id   UUID        NOT NULL REFERENCES raw_signals(id) ON DELETE RESTRICT,
  event_type      TEXT        NOT NULL,
  value           NUMERIC,
  unit            TEXT,
  period_start    DATE,
  period_end      DATE,
  occurred_at     TIMESTAMPTZ NOT NULL,
  metadata        JSONB       NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS signal_events_entity_type_idx
  ON signal_events(entity_id, event_type);
CREATE INDEX IF NOT EXISTS signal_events_tenant_occurred_idx
  ON signal_events(tenant_id, occurred_at DESC);

-- ---------------------------------------------------------------------------
-- 6. SCORING RUNS — one record per engine execution
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scoring_runs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  triggered_by  TEXT        NOT NULL
                            CHECK (triggered_by IN ('schedule','manual','ingest')),
  actor         TEXT        NOT NULL DEFAULT 'system',
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  entity_count  INTEGER,
  status        TEXT        NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running','completed','failed'))
);
CREATE INDEX IF NOT EXISTS scoring_runs_tenant_idx ON scoring_runs(tenant_id, started_at DESC);

-- ---------------------------------------------------------------------------
-- 7. ENTITY SCORES — output of one scoring run for one entity
-- rule_trace is the auditable proof of why this verdict was reached.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entity_scores (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  run_id      UUID        NOT NULL REFERENCES scoring_runs(id) ON DELETE RESTRICT,
  entity_id   UUID        NOT NULL REFERENCES canonical_entities(id) ON DELETE RESTRICT,
  verdict     TEXT        NOT NULL
                          CHECK (verdict IN ('verified','review_required','blocked','low_confidence')),
  confidence  NUMERIC     NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  rule_trace  JSONB       NOT NULL DEFAULT '[]',
  scored_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entity_scores_entity_run_idx
  ON entity_scores(entity_id, run_id);
CREATE INDEX IF NOT EXISTS entity_scores_tenant_verdict_idx
  ON entity_scores(tenant_id, verdict);

-- ---------------------------------------------------------------------------
-- 8. DECISIONS — formal human-readable decision records
-- Transitions: pending → approved|rejected → executed|withdrawn
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decisions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entity_id        UUID        NOT NULL REFERENCES canonical_entities(id) ON DELETE RESTRICT,
  score_id         UUID        NOT NULL REFERENCES entity_scores(id) ON DELETE RESTRICT,
  verdict          TEXT        NOT NULL CHECK (verdict IN ('verified','review_required','blocked')),
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected','executed','withdrawn')),
  requires_approval BOOLEAN    NOT NULL DEFAULT true,
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  executed_at      TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS decisions_tenant_status_idx ON decisions(tenant_id, status);
CREATE INDEX IF NOT EXISTS decisions_entity_idx ON decisions(entity_id);

-- ---------------------------------------------------------------------------
-- 9. OUTBOUND QUEUE — entities cleared for outbound action
-- readiness_checks documents each check that was evaluated.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outbound_queue (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID        NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  decision_id      UUID        NOT NULL REFERENCES decisions(id) ON DELETE RESTRICT,
  readiness_checks JSONB       NOT NULL DEFAULT '{}',
  is_ready         BOOLEAN     NOT NULL DEFAULT false,
  ready_at         TIMESTAMPTZ,
  dispatched_at    TIMESTAMPTZ,
  dispatch_status  TEXT        CHECK (dispatch_status IN ('queued','dispatched','failed')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (decision_id),
  -- Layer 1: declarative guard — any writer (ORM, psql, migration) is blocked.
  -- (expr)::boolean IS TRUE is false when expr is NULL, so a missing JSONB key
  -- also triggers a violation. The trigger (Layer 2) adds cross-table checks.
  CONSTRAINT chk_outbound_ready_integrity CHECK (
    NOT is_ready
    OR (
      ready_at IS NOT NULL
      AND (readiness_checks -> 'confidence_threshold' ->> 'passed')::boolean IS TRUE
      AND (readiness_checks -> 'verdict_consistency'  ->> 'passed')::boolean IS TRUE
      AND (readiness_checks -> 'pdpl_consent'         ->> 'passed')::boolean IS TRUE
      AND (readiness_checks -> 'approval_gate'        ->> 'passed')::boolean IS TRUE
    )
  )
);
CREATE INDEX IF NOT EXISTS outbound_queue_ready_idx ON outbound_queue(is_ready, ready_at);

-- ---------------------------------------------------------------------------
-- Layer 2: BEFORE trigger — cross-table validation of is_ready=true writes.
-- Rejects writes when the linked decision has a non-actionable verdict or a
-- terminal status, which the CHECK constraint cannot see.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_outbound_ready_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_verdict TEXT;
  v_status  TEXT;
BEGIN
  IF NEW.is_ready IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.ready_at IS NULL THEN
    RAISE EXCEPTION
      'outbound_queue: is_ready=true requires ready_at (decision_id=%)',
      NEW.decision_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT (
    (NEW.readiness_checks -> 'confidence_threshold' ->> 'passed')::boolean IS TRUE
    AND (NEW.readiness_checks -> 'verdict_consistency'  ->> 'passed')::boolean IS TRUE
    AND (NEW.readiness_checks -> 'pdpl_consent'         ->> 'passed')::boolean IS TRUE
    AND (NEW.readiness_checks -> 'approval_gate'        ->> 'passed')::boolean IS TRUE
  ) THEN
    RAISE EXCEPTION
      'outbound_queue: is_ready=true requires all readiness_checks gates passed=true (decision_id=%)',
      NEW.decision_id
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT verdict, status INTO v_verdict, v_status
  FROM   decisions
  WHERE  id = NEW.decision_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'outbound_queue: decision % not found',
      NEW.decision_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_verdict = 'low_confidence' THEN
    RAISE EXCEPTION
      'outbound_queue: is_ready=true not permitted for low_confidence verdict (decision_id=%)',
      NEW.decision_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_status IN ('rejected', 'withdrawn') THEN
    RAISE EXCEPTION
      'outbound_queue: is_ready=true not permitted when decision status=% (decision_id=%)',
      v_status, NEW.decision_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_outbound_ready_guard ON outbound_queue;
CREATE TRIGGER trg_outbound_ready_guard
  BEFORE INSERT OR UPDATE ON outbound_queue
  FOR EACH ROW
  EXECUTE FUNCTION fn_outbound_ready_guard();

-- ---------------------------------------------------------------------------
-- 10. AUDIT LOG — immutable, append-only governance record
-- GRANT INSERT only; no UPDATE or DELETE ever.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL,
  actor        TEXT        NOT NULL,
  action       TEXT        NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  before_state JSONB,
  after_state  JSONB,
  reason       TEXT,
  ip_address   INET,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_tenant_entity_idx
  ON audit_log(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_occurred_at_idx
  ON audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx
  ON audit_log(tenant_id, action);
