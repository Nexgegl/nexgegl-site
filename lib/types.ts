// =============================================================================
// NEXGEGL — Canonical TypeScript Types
// Mirror the PostgreSQL schema exactly. No optional fields that are NOT NULL in DB.
// =============================================================================

// ---------------------------------------------------------------------------
// Enumerations (mirror CHECK constraints)
// ---------------------------------------------------------------------------

export type TenantTier = "standard" | "enterprise";

export type SourceType = "erp" | "crm" | "telematics" | "ads" | "sales" | "manual";

export type DedupStatus = "pending" | "accepted" | "duplicate";

export type EntityType =
  | "product"
  | "campaign"
  | "route"
  | "asset"
  | "initiative"
  | "sku";

export type Verdict = "kill" | "fix" | "scale" | "none" | "insufficient_data";

export type DecisionVerdict = Exclude<Verdict, "insufficient_data">;

export type DecisionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "withdrawn";

export type ScoringTrigger = "schedule" | "manual" | "ingest";

export type ScoringRunStatus = "running" | "completed" | "failed";

export type DispatchStatus = "queued" | "dispatched" | "failed";

// ---------------------------------------------------------------------------
// Row types (what comes back from the DB)
// ---------------------------------------------------------------------------

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  tier: TenantTier;
  pdpl_consent_recorded_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type DataSource = {
  id: string;
  tenant_id: string;
  source_type: SourceType;
  slug: string;
  connection_config: Record<string, unknown>;
  is_active: boolean;
  last_ingested_at: Date | null;
  created_at: Date;
};

export type RawSignal = {
  id: string;
  tenant_id: string;
  source_id: string;
  source_type: string;
  payload: Record<string, unknown>;
  fingerprint: string;
  dedup_status: DedupStatus;
  ingested_at: Date;
};

export type CanonicalEntity = {
  id: string;
  tenant_id: string;
  entity_type: EntityType;
  external_id: string;
  name: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type SignalEvent = {
  id: string;
  tenant_id: string;
  entity_id: string;
  source_id: string;
  raw_signal_id: string;
  event_type: string;
  value: number | null;
  unit: string | null;
  period_start: string | null;
  period_end: string | null;
  occurred_at: Date;
  metadata: Record<string, unknown>;
};

export type ScoringRun = {
  id: string;
  tenant_id: string;
  triggered_by: ScoringTrigger;
  actor: string;
  started_at: Date;
  completed_at: Date | null;
  entity_count: number | null;
  status: ScoringRunStatus;
};

export type EntityScore = {
  id: string;
  tenant_id: string;
  run_id: string;
  entity_id: string;
  verdict: Verdict;
  confidence: number;
  rule_trace: RuleResult[];
  scored_at: Date;
};

export type Decision = {
  id: string;
  tenant_id: string;
  entity_id: string;
  score_id: string;
  verdict: DecisionVerdict;
  status: DecisionStatus;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: Date | null;
  executed_at: Date | null;
  notes: string | null;
  created_at: Date;
};

export type OutboundQueueEntry = {
  id: string;
  tenant_id: string;
  decision_id: string;
  readiness_checks: ReadinessChecks;
  is_ready: boolean;
  ready_at: Date | null;
  dispatched_at: Date | null;
  dispatch_status: DispatchStatus | null;
  created_at: Date;
};

export type AuditLogEntry = {
  id: string;
  tenant_id: string;
  actor: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  occurred_at: Date;
};

// ---------------------------------------------------------------------------
// Scoring engine internals
// ---------------------------------------------------------------------------

export type RuleResult = {
  rule: string;
  fired: boolean;
  direction: "positive" | "negative" | "neutral";
  weight: number;
  evidence: Record<string, unknown>;
};

export type ScoringInput = {
  entity: CanonicalEntity;
  events: SignalEvent[];
};

export type ScoringOutput = {
  verdict: Verdict;
  confidence: number;
  rule_trace: RuleResult[];
};

// ---------------------------------------------------------------------------
// Readiness checks
// ---------------------------------------------------------------------------

export type ReadinessChecks = {
  confidence_threshold: { passed: boolean; value: number; threshold: number };
  verdict_consistency: { passed: boolean; consecutive_matches: number; required: number };
  pdpl_consent: { passed: boolean };
  approval_gate: { passed: boolean; requires_approval: boolean; approved: boolean };
};

// ---------------------------------------------------------------------------
// Ingestion API
// ---------------------------------------------------------------------------

export type IngestRecord = {
  external_id: string;
  entity_type: EntityType;
  name: string;
  metadata?: Record<string, unknown>;
  events: IngestEvent[];
};

export type IngestEvent = {
  event_type: string;
  value?: number;
  unit?: string;
  period_start?: string;
  period_end?: string;
  occurred_at: string;
  metadata?: Record<string, unknown>;
};

export type IngestPayload = {
  tenant_id: string;
  source_id: string;
  records: IngestRecord[];
};

export type IngestResult = {
  accepted: number;
  duplicates: number;
  errors: Array<{ external_id: string; reason: string }>;
};
