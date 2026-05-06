import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getQualificationCounts } from "@/lib/scoring";

export const runtime = "nodejs";

type ExecCountsResponse = {
  verified: number;
  review_required: number;
  blocked: number;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id query param required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const counts: ExecCountsResponse = await getQualificationCounts(client, tenantId);
    return NextResponse.json(counts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    client.release();
  }
}
