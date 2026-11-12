import { NextResponse } from "next/server";
import { cases, substanceTable } from "@/domain/data";
import { readAudit, verifyRows } from "@/domain/hashchain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const verification = verifyRows(await readAudit());
    return NextResponse.json({
      ok: true,
      rows: { cases: cases.length, substances: Object.keys(substanceTable).length, audit: verification.total },
      audit_intact: verification.brokenAt === null,
      database: "postgresql",
      llm: false,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "unknown" }, { status: 503 });
  }
}
