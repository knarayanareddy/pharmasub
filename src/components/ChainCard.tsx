import { Check, ChevronRight, Package, Repeat2 } from "lucide-react";
import type { ChainVerdict } from "@/domain/types";
import { RuleChip, SourceLine, StatusBadge } from "./Primitives";

const routeLabels = { nl_geregistreerd: "NL-geregistreerd", import: "Importroute", bereiding: "Bereiding" };

export function ChainCard({ verdict, rank, selected, onSelect }: { verdict: ChainVerdict; rank: number; selected: boolean; onSelect: () => void }) {
  const link = verdict.chain[0];
  if (!link) return null;
  return <article className={`chain-card ${selected ? "selected" : ""}`} data-chain={verdict.chain_id}>
    <div className="chain-card-header"><div><span className="rank mono">#{String(rank).padStart(2, "0")}</span><StatusBadge status={verdict.status} /></div><span className="hop-label"><Repeat2 size={12} />{link.hop} hop</span></div>
    <h3>{link.product}</h3>
    <div className="chain-route"><span className={`route-dot ${link.route}`} />{routeLabels[link.route]}{link.foreign_registration && <span className="mono">{link.foreign_registration}</span>}</div>
    <div className="chain-facts">
      <SourceLine source={link.source} compact><span className="fact-label">Sterkte</span><strong className="mono">{link.strength}</strong></SourceLine>
      <SourceLine source={link.source} compact><span className="fact-label">Vorm</span><strong>{link.form}</strong></SourceLine>
      <SourceLine source={link.source} compact><span className="fact-label">Verpakking</span><strong><Package size={12} />{link.package}</strong></SourceLine>
    </div>
    {verdict.equivalence_note_nl && <div className="equivalence-note"><Repeat2 size={14} /><span>{verdict.equivalence_note_nl}</span></div>}
    <div className="reimbursement-line"><span className="reimbursement-icon"><Check size={14} /></span><div><strong>Vergoed volgens momentopname</strong><span>{verdict.reimbursement_source?.insurer} · peildatum {verdict.reimbursement_source?.peildatum}</span><small>voorbeelddata — geen officiële lijst · geen garantie</small></div><RuleChip tone="valid">P-REIMB-01</RuleChip></div>
    <div className="passed-rules">{verdict.rules_passed.map((rule) => <RuleChip key={rule} tone="valid">{rule}</RuleChip>)}</div>
    <button className={`btn select-chain ${selected ? "primary" : ""}`} onClick={onSelect}>{selected ? <><Check size={15} />Geselecteerd voor beoordeling</> : <>Beoordeel deze keten<ChevronRight size={15} /></>}</button>
  </article>;
}
