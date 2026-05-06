import { NextRequest, NextResponse } from "next/server";
import { ingest } from "@/lib/ingest";
import { IngestPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as Partial<IngestPayload>;

  if (!payload.tenant_id || !payload.source_id || !Array.isArray(payload.records)) {
    return NextResponse.json(
      { error: "tenant_id, source_id, and records[] are required" },
      { status: 400 }
    );
  }

  if (payload.records.length === 0) {
    return NextResponse.json({ accepted: 0, duplicates: 0, errors: [] });
  }

  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

  try {
    const result = await ingest(payload as IngestPayload, "api", ip ?? undefined);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
