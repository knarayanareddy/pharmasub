import { NextResponse } from "next/server";
import { getCase } from "@/domain/data";
import { buildAdvice, withApproval } from "@/domain/engine";
import { appendAuditBatch, latestApproval, readAudit } from "@/domain/hashchain";
import { createApproval, type Edit } from "@/domain/types";
import { normalizeCase } from "@/domain/intake";
import { langFromRequest } from "@/i18n/dictionary";

export async function POST(request: Request) {
  const lang = langFromRequest(request);
  const body = await request.json() as { case?: unknown; case_id?: string; chain_id?: string; by?: string; edits?: Edit[] };
  const c = normalizeCase(body.case) || (body.case_id ? getCase(body.case_id) : undefined);
  if (!c || !body.chain_id || !body.by?.trim()) {
    return NextResponse.json(
      {
        error: "E-APPROVAL-01",
        message: lang === "en" ? "A dispensing advice requires pharmacist approval." : "Een afleveradvies vereist goedkeuring door de apotheker.",
      },
      { status: 409 },
    );
  }
  const base = buildAdvice(c);
  const chain = base.chains.find((item) => item.chain_id === body.chain_id && item.status === "geldig");
  if (!chain) {
    return NextResponse.json(
      {
        error: "E-APPROVAL-01",
        message: lang === "en" ? "Only a valid chain can be approved by a pharmacist." : "Alleen een geldige keten kan door een apotheker worden goedgekeurd.",
      },
      { status: 409 },
    );
  }
  const at = new Date().toISOString();
  const approval = createApproval(chain.chain_id, body.by, at);
  const previous = await latestApproval(c.case_id);
  let row = (await readAudit()).at(-1);
  const batch: Parameters<typeof appendAuditBatch>[0] = [];
  if (!previous || previous.chain_id !== chain.chain_id) {
    batch.push({ actor: body.by, action: "CASE_OPENED", subject: c.case_id, payload: { synthetic: true } });
    batch.push({ actor: "regel-engine", action: "CHAINS_GENERATED", subject: c.case_id, payload: { total: base.chains.length, deterministic: true } });
    for (const refusal of base.refusals) batch.push({ actor: "regel-engine", action: "CHAIN_REJECTED", subject: c.case_id, payload: { chain_id: refusal.chain_id, rule: refusal.reject_rule, status: refusal.status } });
    batch.push({ actor: body.by, action: "CHAIN_APPROVED", subject: c.case_id, payload: { chain_id: chain.chain_id, by: body.by, at, rules: chain.rules_passed, sources: chain.sources, ...(c.case_id.startsWith("X-") ? { case_snapshot: c } : {}) } });
  }
  const edits = (body.edits || []).map((edit) => ({ ...edit, by: body.by!, at: edit.at || at }));
  for (const edit of edits) batch.push({ actor: body.by, action: "EDIT_MADE", subject: c.case_id, payload: { edit } });
  if (batch.length) row = (await appendAuditBatch(batch)).at(-1);
  if (!row) return NextResponse.json({ error: "E-AUDIT-01" }, { status: 500 });
  return NextResponse.json({ seq: row.seq, hash: row.hash, advice: withApproval(base, approval, [...(previous?.chain_id === chain.chain_id ? previous.edits : []), ...edits]) });
}
