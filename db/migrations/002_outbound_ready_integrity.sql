-- =============================================================================
-- Migration 002 — Outbound Queue: is_ready Integrity Guard
--
-- Problem: nothing at DB level prevented a raw UPDATE from setting is_ready=true
-- on a row whose readiness checks had not all passed, or whose linked decision
-- had a terminal / non-actionable status.
--
-- Solution: two enforcement layers.
--
--   Layer 1 — CHECK constraint (chk_outbound_ready_integrity)
--     Declarative. PostgreSQL evaluates it for every INSERT and UPDATE,
--     including psql sessions and any future ORM. Validates the stored JSONB:
--     when is_ready=true every gate's "passed" field must be true and
--     ready_at must be non-null.
--
--   Layer 2 — BEFORE trigger (trg_outbound_ready_guard)
--     Cross-table. When is_ready is being set to true the trigger fetches the
--     linked decisions row and rejects the write if:
--       • the decision verdict is 'low_confidence' (not actionable), or
--       • the decision status is 'rejected' or 'withdrawn' (terminal).
--
-- Both layers must independently block an invalid is_ready=true write.
-- The CHECK constraint fires first (cheapest); the trigger fires second.
--
-- Rollback: 002_rollback.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Layer 1: CHECK constraint on outbound_queue
-- When is_ready = false the constraint is trivially satisfied (NOT false = true).
-- When is_ready = true every readiness gate must show passed=true and
-- ready_at must be set.
-- NOTE: (expr)::boolean IS TRUE evaluates to FALSE when expr is NULL,
-- so a missing or null JSONB key also triggers a violation.
-- ---------------------------------------------------------------------------
ALTER TABLE outbound_queue
  ADD CONSTRAINT chk_outbound_ready_integrity
  CHECK (
    NOT is_ready
    OR (
      ready_at IS NOT NULL
      AND (readiness_checks -> 'confidence_threshold' ->> 'passed')::boolean IS TRUE
      AND (readiness_checks -> 'verdict_consistency'  ->> 'passed')::boolean IS TRUE
      AND (readiness_checks -> 'pdpl_consent'         ->> 'passed')::boolean IS TRUE
      AND (readiness_checks -> 'approval_gate'        ->> 'passed')::boolean IS TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- Layer 2: trigger function — cross-table validation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_outbound_ready_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_verdict TEXT;
  v_status  TEXT;
BEGIN
  -- Only validate when is_ready is being set to true.
  IF NEW.is_ready IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- ready_at must be set (belt-and-suspenders; CHECK covers this too).
  IF NEW.ready_at IS NULL THEN
    RAISE EXCEPTION
      'outbound_queue: is_ready=true requires ready_at (decision_id=%)',
      NEW.decision_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- All four readiness gates must be stored as passed=true.
  IF NOT (
    (NEW.readiness_checks -> 'confidence_threshold' ->> 'passed')::boolean IS TRUE
    AND (NEW.readiness_checks -> 'verdict_consistency'  ->> 'passed')::boolean IS TRUE
    AND (NEW.readiness_checks -> 'pdpl_consent'         ->> 'passed')::boolean IS TRUE
    AND (NEW.readiness_checks -> 'approval_gate'        ->> 'passed')::boolean IS TRUE
  ) THEN
    RAISE EXCEPTION
      'outbound_queue: is_ready=true requires all readiness_checks gates to be passed=true (decision_id=%)',
      NEW.decision_id
      USING ERRCODE = 'check_violation';
  END IF;

  -- Cross-table: the linked decision must exist, have an actionable verdict,
  -- and must not be in a terminal status.
  SELECT verdict, status
  INTO   v_verdict, v_status
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

-- DROP + CREATE is idempotent on PG < 14 (which lacks CREATE OR REPLACE TRIGGER).
DROP TRIGGER IF EXISTS trg_outbound_ready_guard ON outbound_queue;
CREATE TRIGGER trg_outbound_ready_guard
  BEFORE INSERT OR UPDATE ON outbound_queue
  FOR EACH ROW
  EXECUTE FUNCTION fn_outbound_ready_guard();

-- ---------------------------------------------------------------------------
-- Record this migration
-- ---------------------------------------------------------------------------
INSERT INTO schema_migrations (version, description)
VALUES (
  '002',
  'outbound_queue: CHECK constraint + BEFORE trigger guard on is_ready=true integrity'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
