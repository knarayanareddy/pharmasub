"use client";

import { CircleHelp, X } from "lucide-react";
import type { ChainVerdict } from "@/domain/types";
import { useLang } from "@/i18n/LanguageProvider";
import { RuleChip, SourceLine, StatusBadge } from "./Primitives";

export function RefusalRow({ verdict, index }: { verdict: ChainVerdict; index: number }) {
  const { lang, t } = useLang();
  const link = verdict.chain[0];
  return <article className={`refusal-row ${verdict.status}`} data-refusal>
    <div className="refusal-top"><span className="refusal-number mono">{String(index + 1).padStart(2, "0")}</span><StatusBadge status={verdict.status} />{verdict.reject_rule && <RuleChip tone={verdict.status === "onbekend" ? "unknown" : "reject"}>{verdict.reject_rule}</RuleChip>}</div>
    <h3>{link?.product || (verdict.reject_rule === "P-SUB-01" ? t("therapy_title") : t("unknown_title"))}</h3>
    <div className="refusal-reason"><span>{verdict.status === "onbekend" ? <CircleHelp size={16} /> : <X size={16} />}</span><p>{verdict.reject_reason_nl}{lang === "en" && verdict.reject_reason_en ? <span className="en-gloss"><span className="en-gloss-label">{t("gloss_label")}</span>{verdict.reject_reason_en}</span> : null}</p></div>
    {verdict.reimbursement === "onbekend" && verdict.status === "afgewezen" && <div className="reimbursement-state"><CircleHelp size={12} /> {t("insurer_status")} <strong>{t("status_unknown")}</strong></div>}
    {link && <div className="refusal-meta mono">{link.strength} · {link.form} · {link.package}</div>}
    {verdict.reimbursement_source && <div className="refusal-insurer"><strong>{verdict.reimbursement_source.insurer}</strong><span>{lang === "en" ? "snapshot date" : "peildatum"} {verdict.reimbursement_source.peildatum}</span></div>}
    {verdict.sources[0] && <SourceLine source={verdict.sources[0]} compact><span className="tiny">{t("source_label")}</span></SourceLine>}
    <div className="human-next-step">{t("next_step")}{verdict.reject_rule === "P-SUB-01" ? t("next_step_prescriber") : ""}.</div>
  </article>;
}
