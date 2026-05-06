-- =============================================================================
-- Test suite: audit_log append-only enforcement
--
-- Run:   psql $DATABASE_URL -f db/tests/audit_log_immutability_test.sql
--
-- The entire suite runs inside a single transaction that is unconditionally
-- rolled back at the end — it leaves no persistent state in the database.
--
-- Nested PL/pgSQL blocks catch expected exceptions without aborting the outer
-- transaction (PostgreSQL subtransaction semantics). An expected exception
-- is caught, the subtransaction is rolled back, and the outer block proceeds.
--
-- EXIT CODE: psql exits non-zero only if the final DO block raises an
-- unhandled exception (FAIL count > 0), making this safe to run in CI.
--
-- Test inventory (3 cases):
--   ACCEPT  T1  INSERT a new audit_log row
--   REJECT  T2  UPDATE the inserted row (any column)
--   REJECT  T3  DELETE the inserted row
-- =============================================================================

BEGIN;

DO $$
DECLARE
  v_tenant_id UUID := gen_random_uuid();
  v_log_id    UUID;
  v_pass      INT  := 0;
  v_fail      INT  := 0;
BEGIN

  -- -------------------------------------------------------------------------
  -- Fixture: minimal tenant (audit_log.tenant_id has no FK to tenants, but
  -- inserting a real tenant makes the fixture realistic and self-describing).
  -- -------------------------------------------------------------------------
  INSERT INTO tenants (id, slug, name, tier)
  VALUES (v_tenant_id, '_test_audit_immutability', 'Test Tenant (audit immutability)', 'standard');

  -- =========================================================================
  -- T1 ACCEPT — INSERT must succeed
  -- The trigger fires only on UPDATE and DELETE; INSERT is unrestricted.
  -- =========================================================================
  BEGIN
    INSERT INTO audit_log (tenant_id, actor, action, entity_type, reason)
    VALUES (v_tenant_id, 'test-runner', 'test.action', 'test', 'immutability test fixture')
    RETURNING id INTO v_log_id;

    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T1 — INSERT into audit_log accepted (id=%)', v_log_id;
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T1 — INSERT into audit_log was unexpectedly rejected (%)', SQLERRM;
  END;

  -- Guard: if T1 failed, T2 and T3 have no row to target; skip with failures.
  IF v_log_id IS NULL THEN
    v_fail := v_fail + 2;
    RAISE WARNING 'SKIP T2, T3 — no row inserted in T1; both counted as failures';
  ELSE

    -- =======================================================================
    -- T2 REJECT — UPDATE must be blocked by the immutability trigger
    -- Attempts to overwrite the actor field, which must never be possible.
    -- =======================================================================
    BEGIN
      UPDATE audit_log SET actor = 'tampered' WHERE id = v_log_id;
      -- If we reach this line the trigger did not fire — that is a failure.
      v_fail := v_fail + 1;
      RAISE WARNING 'FAIL T2 — UPDATE on audit_log was accepted (trigger did not fire)';
    EXCEPTION WHEN OTHERS THEN
      v_pass := v_pass + 1;
      RAISE NOTICE 'PASS T2 — UPDATE on audit_log rejected (%)', SQLERRM;
    END;

    -- =======================================================================
    -- T3 REJECT — DELETE must be blocked by the immutability trigger
    -- =======================================================================
    BEGIN
      DELETE FROM audit_log WHERE id = v_log_id;
      -- If we reach this line the trigger did not fire — that is a failure.
      v_fail := v_fail + 1;
      RAISE WARNING 'FAIL T3 — DELETE on audit_log was accepted (trigger did not fire)';
    EXCEPTION WHEN OTHERS THEN
      v_pass := v_pass + 1;
      RAISE NOTICE 'PASS T3 — DELETE on audit_log rejected (%)', SQLERRM;
    END;

  END IF;

  -- =========================================================================
  -- Summary
  -- =========================================================================
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Results: %/3 passed, % failed', v_pass, v_fail;

  IF v_fail > 0 THEN
    RAISE EXCEPTION 'TEST SUITE FAILED: % test(s) did not produce the expected outcome', v_fail;
  END IF;

  RAISE NOTICE 'ALL TESTS PASSED';
END;
$$;

-- Unconditional rollback — the suite never modifies persistent state.
ROLLBACK;
