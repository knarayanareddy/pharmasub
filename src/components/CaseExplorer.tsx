"use client";

import Link from "next/link";
import { ArrowRight, Check, Search, ShieldX, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FlagPill, StatusBadge } from "./Primitives";

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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"alle" | "geldig" | "geen">("alle");
  const filtered = useMemo(() => items.filter((item) => {
    const matchesQuery = `${item.case_id} ${item.substance} ${item.atc}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === "alle" || filter === "geldig" && item.valid > 0 || filter === "geen" && item.valid === 0);
  }), [items, query, filter]);
  return <section className="case-library" aria-labelledby="case-library-title">
    <div className="library-heading">
      <div><div className="eyebrow">Casusbibliotheek</div><h2 id="case-library-title">Dertig casussen. Geen verborgen uitkomsten.</h2></div>
      <span className="mono tiny">30 SYNTHETISCHE CASUSSEN · 20 STOFFEN</span>
    </div>
    <div className="library-toolbar">
      <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op casus, stof of ATC…" aria-label="Zoek casussen" /></label>
      <div className="filter-group" aria-label="Filter casussen"><SlidersHorizontal size={14} />
        {([["alle", `Alle ${items.length}`], ["geldig", "Met geldige keten"], ["geen", "Nul geldige ketens"]] as const).map(([id, label]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}
      </div>
    </div>
    <div className="case-table" role="table" aria-label="Substitutiecasussen">
      <div className="case-table-head" role="row"><span>Casus</span><span>Voorschrift</span><span>Scenario</span><span>Patiëntkenmerken</span><span>Uitkomst</span><span /></div>
      {filtered.map((item) => <div className="case-row" role="row" key={item.case_id}>
        <div><Link href={`/case/${item.case_id}`} className="case-id mono">{item.case_id}</Link><span className="tiny muted">{item.insurer}</span></div>
        <div><strong>{item.substance}</strong><span className="mono tiny muted">{item.strength} · {item.atc}</span></div>
        <div><span className="scenario-label">{item.scenario}</span><span className="tiny muted">{item.form}</span></div>
        <div className="case-flags">{item.flags.length ? item.flags.map((flag) => <FlagPill key={flag}>{flag.replaceAll("_", " ")}</FlagPill>) : <span className="muted small">Geen flags</span>}</div>
        <div className="case-outcome">{item.valid > 0 ? <><span className="outcome-valid"><Check size={14} />{item.valid} geldig</span>{item.refused > 0 && <span className="outcome-refused"><X size={13} />{item.refused} geweigerd</span>}</> : <><span className="outcome-none"><ShieldX size={15} />0 geldig</span><span className="tiny muted">{item.refused} zichtbare weigeringen</span></>}</div>
        <Link href={`/case/${item.case_id}`} className="icon-btn" aria-label={`Open ${item.case_id}`}><ArrowRight size={16} /></Link>
      </div>)}
      {!filtered.length && <div className="empty-state">Geen casussen gevonden binnen dit filter.</div>}
    </div>
  </section>;
}
