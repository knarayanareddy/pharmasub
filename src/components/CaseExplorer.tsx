"use client";

import Link from "next/link";
import { ArrowRight, Check, Search, ShieldX, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLang } from "@/i18n/LanguageProvider";
import { FlagPill } from "./Primitives";

export interface CaseSummary {
  case_id: string;
  substance: string;
  atc: string;
  strength: string;
  form: string;
  insurer: string;
  flags: string[];
  valid: number;
  refused: number;
  scenario: "gelijke sterkte" | "sterkte / verpakking" | "geen veilige keten";
}

export function CaseExplorer({ items }: { items: CaseSummary[] }) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"alle" | "geldig" | "geen">("alle");
  const filtered = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.case_id} ${item.substance} ${item.atc}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "alle" || filter === "geldig" && item.valid > 0 || filter === "geen" && item.valid === 0);
  }), [items, query, filter]);
  const scenarioLabel = (s: CaseSummary["scenario"]) =>
    s === "gelijke sterkte" ? t("scenario_same") : s === "sterkte / verpakking" ? t("scenario_strength") : t("scenario_none");
  return <section className="case-library" aria-labelledby="case-library-title">
    <div className="library-heading">
      <div><div className="eyebrow">{t("cases_eyebrow")}</div><h2 id="case-library-title">{t("cases_h2")}</h2></div>
      <span className="mono tiny">{t("cases_meta")}</span>
    </div>
    <div className="library-toolbar">
      <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search_placeholder")} aria-label={t("search_label")} /></label>
      <div className="filter-group" aria-label={t("filter_aria")}><SlidersHorizontal size={14} />
        {([["alle", t("filter_all", { n: items.length })], ["geldig", t("filter_valid")], ["geen", t("filter_none")]] as const).map(([id, label]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}
      </div>
    </div>
    <div className="case-table" role="table" aria-label={t("table_aria")}>
      <div className="case-table-head" role="row"><span>{t("table_case")}</span><span>{t("table_prescription")}</span><span>{t("table_scenario")}</span><span>{t("table_flags")}</span><span>{t("table_outcome")}</span><span /></div>
      {filtered.map((item) => <div className="case-row" role="row" key={item.case_id}>
        <div><Link href={`/case/${item.case_id}`} className="case-id mono">{item.case_id}</Link><span className="tiny muted">{item.insurer}</span></div>
        <div><strong>{item.substance}</strong><span className="mono tiny muted">{item.strength} · {item.atc}</span></div>
        <div><span className="scenario-label">{scenarioLabel(item.scenario)}</span><span className="tiny muted">{item.form}</span></div>
        <div className="case-flags">{item.flags.length ? item.flags.map((flag) => <FlagPill key={flag}>{t(`flag_${flag}`)}</FlagPill>) : <span className="muted small">{t("no_flags")}</span>}</div>
        <div className="case-outcome">{item.valid > 0 ? <><span className="outcome-valid"><Check size={14} />{t("valid_n", { n: item.valid })}</span>{item.refused > 0 && <span className="outcome-refused"><X size={13} />{t("refused_n", { n: item.refused })}</span>}</> : <><span className="outcome-none"><ShieldX size={15} />{t("zero_valid")}</span><span className="tiny muted">{t("refusals_visible", { n: item.refused })}</span></>}</div>
        <Link href={`/case/${item.case_id}`} className="icon-btn" aria-label={t("open_case", { id: item.case_id })}><ArrowRight size={16} /></Link>
      </div>)}
      {!filtered.length && <div className="empty-state">{t("empty_filter")}</div>}
    </div>
  </section>;
}
