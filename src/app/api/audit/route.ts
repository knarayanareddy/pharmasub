import { NextResponse } from "next/server";
import { readAudit, resetDemoAudit, tamperRowSeven, verifyAudit } from "@/domain/hashchain";

export function GET() { return NextResponse.json({ ...verifyAudit(), rows: readAudit() }); }

export async function POST(request: Request) {
  const body = await request.json() as { op?: "tamper" | "reset" };
  if (body.op === "tamper") tamperRowSeven();
  else if (body.op === "reset") resetDemoAudit();
  else return NextResponse.json({ error: "E-AUDIT-OP" }, { status: 400 });
  return NextResponse.json({ ...verifyAudit(), rows: readAudit() });
}
