import { NextResponse } from "next/server";
import { cases, substanceTable } from "@/domain/data";
import { verifyAudit } from "@/domain/hashchain";

export function GET() {
  return NextResponse.json({ ok: true, rows: { cases: cases.length, substances: Object.keys(substanceTable).length, audit: verifyAudit().total }, offline: true, llm: false });
}
