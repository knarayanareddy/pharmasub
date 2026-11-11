import { CircleHelp, X } from "lucide-react";
import type { ChainVerdict } from "@/domain/types";
import { RuleChip, SourceLine, StatusBadge } from "./Primitives";

export function RefusalRow({ verdict, index }: { verdict: ChainVerdict; index: number }) {
  const link = verdict.chain[0];
  return <article className={`refusal-row ${verdict.status}`} data-refusal>
    <div className="refusal-top"><span className="refusal-number mono">{String(index + 1).padStart(2, "0")}</span><StatusBadge status={verdict.status} />{verdict.reject_rule && <RuleChip tone={verdict.status === "onbekend" ? "unknown" : "reject"}>{verdict.reject_rule}</RuleChip>}</div>
    <h3>{link?.product || (verdict.reject_rule === "P-SUB-01" ? "Therapiewijziging gevraagd" : "Stof niet in regeltabel")}</h3>
    <div className="refusal-reason"><span>{verdict.status === "onbekend" ? <CircleHelp size={16} /> : <X size={16} />}</span><p>{verdict.reject_reason_nl}</p></div>
    {verdict.reimbursement === "onbekend" && verdict.status === "afgewezen" && <div className="reimbursement-state"><CircleHelp size={12} /> Status verzekeraar: <strong>ONBEKEND</strong></div>}
    {link && <div className="refusal-meta mono">{link.strength} · {link.form} · {link.package}</div>}
    {verdict.reimbursement_source && <div className="refusal-insurer"><strong>{verdict.reimbursement_source.insurer}</strong><span>peildatum {verdict.reimbursement_source.peildatum}</span></div>}
    {verdict.sources[0] && <SourceLine source={verdict.sources[0]} compact><span className="tiny">Bron bij deze beoordeling</span></SourceLine>}
    <div className="human-next-step">Volgende stap: beoordeling door apotheker{verdict.reject_rule === "P-SUB-01" ? " en voorschrijver" : ""}.</div>
  </article>;
}
