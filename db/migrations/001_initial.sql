-- =============================================================================
-- Migration 001 — Initial Schema
-- Applied: idempotent (IF NOT EXISTS guards on all objects)
-- Rollback: 001_rollback.sql
-- Author: system
-- =============================================================================

BEGIN;

\i ../schema.sql

-- Record this migration in a migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT        PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT
);

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Initial canonical schema: tenants, data_sources, raw_signals, canonical_entities, signal_events, scoring_runs, entity_scores, decisions, outbound_queue, audit_log')
ON CONFLICT (version) DO NOTHING;

COMMIT;
