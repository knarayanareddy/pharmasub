import { NextResponse } from "next/server";
import { readAudit, resetDemoAudit, tamperRowSeven, verifyRows } from "@/domain/hashchain";

export const dynamic = "force-dynamic";

async function snapshot() {
  const rows = await readAudit();
  return NextResponse.json({ ...verifyRows(rows), rows });
}

export async function GET() { return snapshot(); }

export async function POST(request: Request) {
  const body = await request.json() as { op?: "tamper" | "reset" };
  if (body.op === "tamper") await tamperRowSeven();
  else if (body.op === "reset") await resetDemoAudit();
  else return NextResponse.json({ error: "E-AUDIT-OP" }, { status: 400 });
  return snapshot();
}
