-- =============================================================================
-- Migration 003 — audit_log Immutability
--
-- Problem: the audit_log table had no DB-level enforcement preventing UPDATE
-- or DELETE. A compromised application connection or direct psql session could
-- silently alter or erase audit records.
--
-- Solution: two enforcement layers.
--
--   Layer 1 — REVOKE (privilege removal)
--     Removes UPDATE and DELETE privileges from PUBLIC so no role that
--     inherits from PUBLIC can mutate rows. This covers the application
--     runtime role in a standard PostgreSQL setup.
--
--     IMPORTANT — after applying this migration the DBA must also run:
--
--       REVOKE UPDATE, DELETE ON audit_log FROM <app_role>;
--
--     where <app_role> is the database role used by the application's
--     DATABASE_URL. Substituting the real role name is intentionally left
--     to the operator because the role name is not encoded in source control.
--     The trigger (Layer 2) enforces immutability regardless, but explicit
--     privilege removal is required for a clean security posture.
--
--   Layer 2 — BEFORE trigger (trg_audit_log_immutable)
--     Unconditionally raises an exception for any UPDATE or DELETE attempt.
--     Fires even for roles whose privileges were not explicitly revoked
--     (e.g. the table owner), providing defence-in-depth that privilege
--     management alone cannot guarantee.
--
-- Neither layer renames audit_log, changes column definitions, or alters
-- the audit payload structure.
--
-- Rollback: 003_rollback.sql
--   DROP TRIGGER trg_audit_log_immutable ON audit_log;
--   DROP FUNCTION fn_audit_log_immutable();
--   GRANT UPDATE, DELETE ON audit_log TO PUBLIC;
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Layer 1: Privilege removal
-- REVOKE from PUBLIC propagates to every role that has not been granted the
-- privilege directly. For environments where the application role has an
-- explicit grant, the operator must additionally run:
--   REVOKE UPDATE, DELETE ON audit_log FROM <app_role>;
-- ---------------------------------------------------------------------------
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Layer 2: Immutability trigger
-- Raises an unrecoverable exception for any UPDATE or DELETE row operation.
-- Using ERRCODE 'insufficient_privilege' (28000) is intentional: it signals
-- to callers that the operation is forbidden by design, not a transient error.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_audit_log_immutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'audit_log is append-only: % is not permitted (row id=%)',
    TG_OP, OLD.id
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- DROP + CREATE for compatibility with PostgreSQL < 14.
DROP TRIGGER IF EXISTS trg_audit_log_immutable ON audit_log;
CREATE TRIGGER trg_audit_log_immutable
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_log_immutable();

-- ---------------------------------------------------------------------------
-- Record migration
-- ---------------------------------------------------------------------------
INSERT INTO schema_migrations (version, description)
VALUES (
  '003',
  'audit_log: REVOKE UPDATE/DELETE from PUBLIC + BEFORE trigger enforcing append-only'
)
ON CONFLICT (version) DO NOTHING;

COMMIT;
