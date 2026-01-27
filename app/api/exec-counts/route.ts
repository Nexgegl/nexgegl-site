import { NextResponse } from "next/server";

type ExecCountsResponse = {
  kill: number;
  fix: number;
  scale: number;
};

// MOCK DATA — will be replaced later
const mockDecisions = [
  { id: "1", verdict: "kill" },
  { id: "2", verdict: "fix" },
  { id: "3", verdict: "scale" },
  { id: "4", verdict: "none" },
];

export async function GET() {
  const counts: ExecCountsResponse = {
    kill: 0,
    fix: 0,
    scale: 0,
  };

  for (const decision of mockDecisions) {
    if (decision.verdict === "kill") counts.kill++;
    else if (decision.verdict === "fix") counts.fix++;
    else if (decision.verdict === "scale") counts.scale++;
  }

  return NextResponse.json(counts);
}
