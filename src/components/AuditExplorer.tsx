"use client";

import { AlertTriangle, Check, FileKey2, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { AuditRow } from "@/domain/types";

interface AuditState { total: number; verified: number; brokenAt: number | null; rows: AuditRow[] }

export function AuditExplorer({ initial }: { initial: AuditState }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function operation(op: "tamper" | "reset") {
    setBusy(true);
    const response = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op }) });
    setState(await response.json()); setBusy(false);
  }
  return <>
    <div className="audit-metrics panel"><div><span className="metric-icon valid"><FileKey2 size={20} /></span><strong className="mono">{state.total}</strong><span>regels in JSONL</span></div><div><span className="metric-icon valid"><ShieldCheck size={20} /></span><strong className="mono">{state.verified}</strong><span>cryptografisch geverifieerd</span></div><div><span className={`metric-icon ${state.brokenAt ? "reject" : "valid"}`}>{state.brokenAt ? <AlertTriangle size={20} /> : <Check size={20} />}</span><strong className="mono">{state.brokenAt ?? "null"}</strong><span>brokenAt</span></div></div>
    <div className={`audit-status ${state.brokenAt ? "broken" : "verified"}`}>{state.brokenAt ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}<div><strong>{state.brokenAt ? `Ketenbreuk gevonden bij regel ${state.brokenAt}` : "De volledige auditketen is intact"}</strong><span>{state.brokenAt ? "De payload wijkt af van de opgeslagen SHA-256-hash. Vanaf hier is geen vertrouwen in de keten mogelijk." : "Volgnummer, vorige hash en canonieke SHA-256 komen voor iedere regel overeen."}</span></div></div>
    <div className="audit-actions no-print"><button className="btn danger" disabled={busy} onClick={() => operation("tamper")}><AlertTriangle size={14} />Manipuleer regel 7</button><button className="btn" disabled={busy} onClick={() => operation("reset")}><RotateCcw size={14} />Herstel synthetische demolog</button><span>Alleen demo · reset wist ook goedkeuringen</span></div>
    <div className="audit-log panel"><div className="panel-header"><h2>Append-only gebeurtenissen</h2><span className="mono tiny">logs/audit.jsonl</span></div><div className="audit-table"><div className="audit-table-head"><span>Seq / tijd</span><span>Actie</span><span>Actor / subject</span><span>SHA-256</span></div>{[...state.rows].reverse().map((row) => <div className={`audit-row ${state.brokenAt === row.seq ? "tampered" : ""}`} key={row.seq}><div><strong className="mono">#{String(row.seq).padStart(3, "0")}</strong><span>{new Date(row.ts).toLocaleString("nl-NL")}</span></div><div><strong>{row.action}</strong>{typeof row.payload.rule === "string" && <span className="rule-chip reject">{row.payload.rule}</span>}</div><div><strong>{row.actor}</strong><span className="mono">{row.subject}</span></div><div className="hash-cell mono"><span title={`Vorige hash: ${row.prev_hash}`}>{row.hash.slice(0, 18)}…</span><small>{state.brokenAt === row.seq ? "HASH KLOPT NIET" : "verifieerbaar"}</small></div></div>)}</div></div>
  </>;
}
