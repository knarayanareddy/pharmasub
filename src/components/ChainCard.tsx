"use client";

import { Check, ChevronRight, Package, Repeat2 } from "lucide-react";
import type { ChainVerdict } from "@/domain/types";
import { useLang } from "@/i18n/LanguageProvider";
import { translateForm, translateInsurer, translatePackage, translateProduct, translateStrength } from "@/i18n/translateData";
import { RuleChip, SourceLine, StatusBadge } from "./Primitives";

export function ChainCard({ verdict, rank, selected, onSelect }: { verdict: ChainVerdict; rank: number; selected: boolean; onSelect: () => void }) {
  const { lang, t } = useLang();
  const link = verdict.chain[0];
  if (!link) return null;
  const routeLabel = link.route === "nl_geregistreerd" ? t("route_nl") : link.route === "import" ? t("route_import") : t("route_bereiding");
  const equivNote = lang === "en" && verdict.equivalence_note_en ? verdict.equivalence_note_en : verdict.equivalence_note_nl;
  return <article className={`chain-card ${selected ? "selected" : ""}`} data-chain={verdict.chain_id}>
    <div className="chain-card-header"><div><span className="rank mono">#{String(rank).padStart(2, "0")}</span><StatusBadge status={verdict.status} /></div><span className="hop-label"><Repeat2 size={12} />{link.hop} hop</span></div>
    <h3>{translateProduct(link.product, lang)}</h3>
    <div className="chain-route"><span className={`route-dot ${link.route}`} />{routeLabel}{link.foreign_registration && <span className="mono">{link.foreign_registration}</span>}</div>
    <div className="chain-facts">
      <SourceLine source={link.source} compact><span className="fact-label">{t("fact_strength")}</span><strong className="mono">{translateStrength(link.strength, lang)}</strong></SourceLine>
      <SourceLine source={link.source} compact><span className="fact-label">{t("fact_form")}</span><strong>{translateForm(link.form, lang)}</strong></SourceLine>
      <SourceLine source={link.source} compact><span className="fact-label">{t("fact_package")}</span><strong><Package size={12} />{translatePackage(link.package, lang)}</strong></SourceLine>
    </div>
    {equivNote && <div className="equivalence-note"><Repeat2 size={14} /><span>{equivNote}</span></div>}
    <div className="reimbursement-line"><span className="reimbursement-icon"><Check size={14} /></span><div><strong>{t("reimbursed_title")}</strong><span>{verdict.reimbursement_source?.insurer ? translateInsurer(verdict.reimbursement_source.insurer, lang) : ""} · {t("print_snapshot_date")} {verdict.reimbursement_source?.peildatum}</span><small>{t("example_data")}</small></div><RuleChip tone="valid">P-REIMB-01</RuleChip></div>
    <div className="passed-rules">{verdict.rules_passed.map((rule) => <RuleChip key={rule} tone="valid">{rule}</RuleChip>)}</div>
    <button className={`btn select-chain ${selected ? "primary" : ""}`} onClick={onSelect}>{selected ? <><Check size={15} />{t("selected_btn")}</> : <>{t("select_btn")}<ChevronRight size={15} /></>}</button>
  </article>;
}
