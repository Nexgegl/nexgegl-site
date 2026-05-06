import { NextRequest, NextResponse } from "next/server";
import { runScoringForTenant } from "@/lib/scoring";
import { evaluateReadinessForRun } from "@/lib/readiness";
import { ScoringTrigger } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, triggered_by, actor } = body as {
    tenant_id?: string;
    triggered_by?: string;
    actor?: string;
  };

  if (!tenant_id) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const validTriggers: ScoringTrigger[] = ["manual", "schedule", "ingest"];
  const trigger: ScoringTrigger =
    validTriggers.includes(triggered_by as ScoringTrigger)
      ? (triggered_by as ScoringTrigger)
      : "manual";

  try {
    const run = await runScoringForTenant(tenant_id, trigger, actor ?? "api");

    // Evaluate outbound readiness immediately after the run
    if (run.status === "completed") {
      await evaluateReadinessForRun(run.id, tenant_id, actor ?? "api");
    }

    return NextResponse.json(
      {
        run_id: run.id,
        status: run.status,
        entity_count: run.entity_count,
        started_at: run.started_at,
        completed_at: run.completed_at,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
