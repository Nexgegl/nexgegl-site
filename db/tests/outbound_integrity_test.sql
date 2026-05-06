-- =============================================================================
-- Test suite: outbound_queue.is_ready integrity guard
--
-- Run:   psql $DATABASE_URL -f db/tests/outbound_integrity_test.sql
--
-- The entire suite runs inside a single transaction that is unconditionally
-- rolled back at the end — it leaves no persistent state in the database.
--
-- Each test case uses a nested PL/pgSQL block so that an expected exception
-- is caught without aborting the outer transaction. After each expected
-- failure the subtransaction is implicitly rolled back, the outer state
-- (test tenant, decision, etc.) remains intact, and the next test proceeds.
--
-- EXIT CODE: psql exits non-zero only when the final DO block raises an
-- unhandled exception (FAIL count > 0), making this safe to run in CI.
--
-- Test inventory (10 cases):
--   REJECT  T1  is_ready=true, ready_at=NULL
--   REJECT  T2  is_ready=true, confidence_threshold.passed=false
--   REJECT  T3  is_ready=true, verdict_consistency.passed=false
--   REJECT  T4  is_ready=true, pdpl_consent.passed=false
--   REJECT  T5  is_ready=true, approval_gate.passed=false
--   REJECT  T6  is_ready=true, readiness_checks={} (all gates absent)
--   REJECT  T7  is_ready=true, decision.status='rejected' (terminal)
--   REJECT  T8  UPDATE is_ready false→true with failing confidence check
--   ACCEPT  T9  is_ready=false with empty readiness_checks (always allowed)
--   ACCEPT  T10 is_ready=true, all gates pass, decision is pending+verified
-- =============================================================================

BEGIN;

DO $$
DECLARE
  -- Stable UUIDs for test fixtures
  v_tenant_id   UUID := gen_random_uuid();
  v_source_id   UUID := gen_random_uuid();
  v_entity_id   UUID := gen_random_uuid();
  v_run_id      UUID := gen_random_uuid();
  v_score_id    UUID := gen_random_uuid();
  v_decision_id UUID := gen_random_uuid();
  v_oq_id       UUID;

  -- Fully passing readiness_checks
  v_checks_ok JSONB := '{
    "confidence_threshold": {"passed": true,  "value": 0.80, "threshold": 0.75},
    "verdict_consistency":  {"passed": true,  "consecutive_matches": 2, "required": 2},
    "pdpl_consent":         {"passed": true},
    "approval_gate":        {"passed": true,  "requires_approval": false, "approved": true}
  }';

  -- Variants with one gate failing (top-level key overwrite via ||)
  v_checks_conf_fail JSONB;
  v_checks_vc_fail   JSONB;
  v_checks_pdpl_fail JSONB;
  v_checks_appr_fail JSONB;

  v_pass INT := 0;
  v_fail INT := 0;

BEGIN

  -- -------------------------------------------------------------------------
  -- Fixture setup
  -- -------------------------------------------------------------------------
  INSERT INTO tenants (id, slug, name, tier, pdpl_consent_recorded_at)
  VALUES (v_tenant_id, '_test_oq_integrity', 'Test Tenant (integrity)', 'standard', now());

  INSERT INTO data_sources (id, tenant_id, source_type, slug)
  VALUES (v_source_id, v_tenant_id, 'manual', '_test_source');

  INSERT INTO canonical_entities (id, tenant_id, entity_type, external_id, name)
  VALUES (v_entity_id, v_tenant_id, 'sku', '_SKU-TEST-001', 'Test SKU');

  INSERT INTO scoring_runs (id, tenant_id, triggered_by, actor, status, completed_at, entity_count)
  VALUES (v_run_id, v_tenant_id, 'manual', 'test', 'completed', now(), 1);

  INSERT INTO entity_scores (id, tenant_id, run_id, entity_id, verdict, confidence, rule_trace)
  VALUES (v_score_id, v_tenant_id, v_run_id, v_entity_id, 'verified', 0.80, '[]');

  INSERT INTO decisions (id, tenant_id, entity_id, score_id, verdict, status, requires_approval)
  VALUES (v_decision_id, v_tenant_id, v_entity_id, v_score_id, 'verified', 'pending', false);

  -- Build failing variants
  v_checks_conf_fail := v_checks_ok
    || '{"confidence_threshold": {"passed": false, "value": 0.60, "threshold": 0.75}}';
  v_checks_vc_fail   := v_checks_ok
    || '{"verdict_consistency": {"passed": false, "consecutive_matches": 1, "required": 2}}';
  v_checks_pdpl_fail := v_checks_ok
    || '{"pdpl_consent": {"passed": false}}';
  v_checks_appr_fail := v_checks_ok
    || '{"approval_gate": {"passed": false, "requires_approval": true, "approved": false}}';

  -- =========================================================================
  -- REJECT cases — each must raise an exception to pass
  -- =========================================================================

  -- T1: is_ready=true but ready_at=NULL
  -- Both the trigger and the CHECK constraint block this.
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready, ready_at)
    VALUES (v_tenant_id, v_decision_id, v_checks_ok, true, NULL);
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T1 — is_ready=true with ready_at=NULL was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T1 — is_ready=true with ready_at=NULL rejected (%)', SQLERRM;
  END;

  -- T2: confidence_threshold.passed=false
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready, ready_at)
    VALUES (v_tenant_id, v_decision_id, v_checks_conf_fail, true, now());
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T2 — failing confidence_threshold was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T2 — failing confidence_threshold rejected (%)', SQLERRM;
  END;

  -- T3: verdict_consistency.passed=false
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready, ready_at)
    VALUES (v_tenant_id, v_decision_id, v_checks_vc_fail, true, now());
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T3 — failing verdict_consistency was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T3 — failing verdict_consistency rejected (%)', SQLERRM;
  END;

  -- T4: pdpl_consent.passed=false
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready, ready_at)
    VALUES (v_tenant_id, v_decision_id, v_checks_pdpl_fail, true, now());
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T4 — failing pdpl_consent was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T4 — failing pdpl_consent rejected (%)', SQLERRM;
  END;

  -- T5: approval_gate.passed=false
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready, ready_at)
    VALUES (v_tenant_id, v_decision_id, v_checks_appr_fail, true, now());
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T5 — failing approval_gate was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T5 — failing approval_gate rejected (%)', SQLERRM;
  END;

  -- T6: readiness_checks={} — all keys absent, IS TRUE evaluates to false for each
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready, ready_at)
    VALUES (v_tenant_id, v_decision_id, '{}', true, now());
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T6 — empty readiness_checks {} was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T6 — empty readiness_checks {} rejected (%)', SQLERRM;
  END;

  -- T7: all JSONB gates pass but decision.status='rejected' (terminal)
  -- This tests the cross-table trigger layer that the CHECK constraint cannot see.
  UPDATE decisions SET status = 'rejected' WHERE id = v_decision_id;
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready, ready_at)
    VALUES (v_tenant_id, v_decision_id, v_checks_ok, true, now());
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T7 — is_ready=true on a rejected decision was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T7 — is_ready=true on rejected decision blocked by trigger (%)', SQLERRM;
  END;
  -- Restore decision status for remaining tests
  UPDATE decisions SET status = 'pending' WHERE id = v_decision_id;

  -- T8: UPDATE path — insert is_ready=false (valid), then UPDATE to is_ready=true
  --     with a failing check. Proves the trigger fires on UPDATE, not only INSERT.
  INSERT INTO outbound_queue (id, tenant_id, decision_id, readiness_checks, is_ready)
  VALUES (gen_random_uuid(), v_tenant_id, v_decision_id, '{}', false)
  RETURNING id INTO v_oq_id;

  BEGIN
    UPDATE outbound_queue
    SET    is_ready         = true,
           readiness_checks = v_checks_conf_fail,
           ready_at         = now()
    WHERE  id = v_oq_id;
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T8 — UPDATE to is_ready=true with failing checks was accepted';
  EXCEPTION WHEN OTHERS THEN
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T8 — UPDATE to is_ready=true with failing checks rejected (%)', SQLERRM;
  END;

  -- Clean up T8 row before the ACCEPT tests (UNIQUE constraint on decision_id).
  DELETE FROM outbound_queue WHERE tenant_id = v_tenant_id;

  -- =========================================================================
  -- ACCEPT cases — these must succeed
  -- =========================================================================

  -- T9: is_ready=false — constraint and trigger are both bypassed entirely.
  BEGIN
    INSERT INTO outbound_queue (tenant_id, decision_id, readiness_checks, is_ready)
    VALUES (v_tenant_id, v_decision_id, '{}', false);
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T9 — is_ready=false with empty checks accepted';
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T9 — is_ready=false was incorrectly rejected (%)', SQLERRM;
  END;

  -- Remove T9 row; T10 uses the same decision_id.
  DELETE FROM outbound_queue WHERE tenant_id = v_tenant_id;

  -- T10: is_ready=true, all four gates pass, decision is verified+pending.
  --      This is the golden-path insert that the application produces.
  BEGIN
    INSERT INTO outbound_queue
      (tenant_id, decision_id, readiness_checks, is_ready, ready_at, dispatch_status)
    VALUES
      (v_tenant_id, v_decision_id, v_checks_ok, true, now(), 'queued');
    v_pass := v_pass + 1;
    RAISE NOTICE 'PASS T10 — fully valid outbound_ready row accepted';
  EXCEPTION WHEN OTHERS THEN
    v_fail := v_fail + 1;
    RAISE WARNING 'FAIL T10 — valid row was incorrectly rejected (%)', SQLERRM;
  END;

  -- =========================================================================
  -- Summary
  -- =========================================================================
  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'Results: %/10 passed, % failed', v_pass, v_fail;

  IF v_fail > 0 THEN
    RAISE EXCEPTION 'TEST SUITE FAILED: % test(s) did not produce the expected outcome', v_fail;
  END IF;

  RAISE NOTICE 'ALL TESTS PASSED';
END;
$$;

-- Unconditional rollback — the suite never modifies persistent state.
ROLLBACK;
