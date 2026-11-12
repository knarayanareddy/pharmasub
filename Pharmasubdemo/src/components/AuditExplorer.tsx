"use client";

import { AlertTriangle, Check, FileKey2, RotateCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { AuditRow } from "@/domain/types";
import { useLang } from "@/i18n/LanguageProvider";
import { translateActor } from "@/i18n/translateData";

interface AuditState { total: number; verified: number; brokenAt: number | null; rows: AuditRow[] }

export function AuditExplorer({ initial }: { initial: AuditState }) {
  const { lang, t } = useLang();
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function operation(op: "tamper" | "reset") {
    setBusy(true);
    const response = await fetch("/api/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op }) });
    setState(await response.json()); setBusy(false);
  }
  return <>
    <div className="audit-metrics panel"><div><span className="metric-icon valid"><FileKey2 size={20} /></span><strong className="mono">{state.total}</strong><span>{t("metric_rows")}</span></div><div><span className="metric-icon valid"><ShieldCheck size={20} /></span><strong className="mono">{state.verified}</strong><span>{t("metric_verified")}</span></div><div><span className={`metric-icon ${state.brokenAt ? "reject" : "valid"}`}>{state.brokenAt ? <AlertTriangle size={20} /> : <Check size={20} />}</span><strong className="mono">{state.brokenAt ?? "null"}</strong><span>{t("metric_broken")}</span></div></div>
    <div className={`audit-status ${state.brokenAt ? "broken" : "verified"}`}>{state.brokenAt ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}<div><strong>{state.brokenAt ? t("status_broken_title", { n: state.brokenAt }) : t("status_ok_title")}</strong><span>{state.brokenAt ? t("status_broken_text") : t("status_ok_text")}</span></div></div>
    <div className="audit-actions no-print"><button className="btn danger" disabled={busy} onClick={() => operation("tamper")}><AlertTriangle size={14} />{t("btn_tamper")}</button><button className="btn" disabled={busy} onClick={() => operation("reset")}><RotateCcw size={14} />{t("btn_reset")}</button><span>{t("demo_only")}</span></div>
    <div className="audit-log panel"><div className="panel-header"><h2>{t("log_title")}</h2><span className="mono tiny">logs/audit.jsonl</span></div><div className="audit-table"><div className="audit-table-head"><span>{t("table_seq")}</span><span>{t("table_action")}</span><span>{t("table_actor")}</span><span>{t("table_hash")}</span></div>{[...state.rows].reverse().map((row) => <div className={`audit-row ${state.brokenAt === row.seq ? "tampered" : ""}`} key={row.seq}><div><strong className="mono">#{String(row.seq).padStart(3, "0")}</strong><span>{new Date(row.ts).toLocaleString(lang === "en" ? "en-GB" : "nl-NL")}</span></div><div><strong>{row.action}</strong>{typeof row.payload.rule === "string" && <span className="rule-chip reject">{row.payload.rule}</span>}</div><div><strong>{translateActor(row.actor, lang)}</strong><span className="mono">{row.subject}</span></div><div className="hash-cell mono"><span title={`${lang === "en" ? "Previous hash" : "Vorige hash"}: ${row.prev_hash}`}>{row.hash.slice(0, 18)}…</span><small>{state.brokenAt === row.seq ? t("hash_bad") : t("hash_ok")}</small></div></div>)}</div></div>
  </>;
}
