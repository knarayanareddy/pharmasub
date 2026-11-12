import { NextResponse } from "next/server";
import { getCase } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import { assertAdvice } from "@/domain/invariants";
import { normalizeCase } from "@/domain/intake";
import { langFromRequest } from "@/i18n/dictionary";

export async function POST(request: Request) {
  const lang = langFromRequest(request);
  const body = await request.json() as { case_id?: string; case?: unknown };
  const c = normalizeCase(body.case) || (body.case_id ? getCase(body.case_id) : undefined);
  if (!c) return NextResponse.json({ error: "E-CASE-01", message: lang === "en" ? "Unknown case." : "Onbekende casus." }, { status: 404 });
  const advice = buildAdvice(c);
  assertAdvice(advice);
  return NextResponse.json(advice, { headers: { "X-Audit-Write": "false" } });
}
