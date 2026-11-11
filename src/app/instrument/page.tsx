import { Check, ClipboardCheck, Download, X } from "lucide-react";
import type { Metadata } from "next";
import { ARCH } from "@/domain/swarm/archetypes";
import { answerInstrument, COVERAGE, COVERAGE_EN, ITEMS, ITEMS_EN } from "@/domain/swarm/instrument";
import { buildPersonas } from "@/domain/swarm/personas";
import { fill, getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import "./instrument.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_instrument };
}

export default async function InstrumentPage() {
  const lang = await getLang();
  const d = getDictionary(lang);
  const answers = answerInstrument(buildPersonas());
  const abstentions = answers.filter((row) => row.q_unknown === "zeg ik liever niet").length;
  const coverage = lang === "en" ? COVERAGE_EN : COVERAGE;
  const items = lang === "en" ? ITEMS_EN : ITEMS;
  const blocks = [d.block_a, d.block_b, d.block_c, d.block_d];
  return <div className="page instrument-page"><div className="instrument-heading"><div><div className="eyebrow">{d.inst_eyebrow}</div><h1 className="page-title">{d.inst_h1}</h1><p className="page-intro">{d.inst_intro}</p></div><div className="instrument-downloads"><a className="btn" href="/api/survey?version=v1"><Download size={14} />v1 CSV</a><a className="btn primary" href="/api/survey?version=v2"><Download size={14} />v2 CSV</a></div></div>
    <div className="honesty-strip"><span>{d.honesty_answers}</span><span>{d.honesty_nollm}</span><span>{d.honesty_mapping}</span><span>{fill(d.honesty_abstentions, { n: abstentions })}</span></div>
    <section className="coverage-section"><div className="section-heading"><div><div className="eyebrow">{d.cov_eyebrow}</div><h2>{d.cov_h2}</h2></div><div className="version-scores"><span>v1 <strong>{lang === "en" ? "2.0 / 10" : "2,0 / 10"}</strong></span><span>v2 <strong>{lang === "en" ? "9.5 / 10" : "9,5 / 10"}</strong></span></div></div><div className="coverage-table"><div className="coverage-head"><span>{d.cov_need}</span><span>{d.cov_why}</span><span>v1</span><span>{d.cov_link}</span></div>{coverage.map(([id, need, v1, v2]) => <div className="coverage-row" key={id}><div><span className="mono">{id}</span><strong>{need}</strong></div><span>{id === "N3" ? d.cov_why_sales : id === "N6" ? d.cov_why_value : d.cov_why_assumption}</span><span className={v1 === "✓" ? "covered" : "not-covered"}>{v1 === "✓" ? <Check size={13} /> : <X size={13} />}{v1}</span><span className="covered"><Check size={13} /><span className="mono">{v2}</span></span></div>)}</div></section>
    <section className="items-section"><div className="section-heading"><div><div className="eyebrow">{d.items_eyebrow}</div><h2>{d.items_h2}</h2></div><span className="mono tiny">{d.items_note}</span></div><div className="instrument-blocks">{blocks.map((block, blockIndex) => { const ranges = [[0, 3], [3, 7], [7, 11], [11, 14]][blockIndex]; return <div className="instrument-block" key={block}><h3>{block}</h3>{items.slice(ranges[0], ranges[1]).map(([id, question, options], index) => <div className="instrument-item" key={id}><span className="item-number mono">{String(ranges[0] + index + 1).padStart(2, "0")}</span><div><strong>{question}</strong><span>{options}</span><small className="mono">{id}</small></div></div>)}</div>; })}</div></section>
    <section className="answering-note"><ClipboardCheck size={24} /><div><h2>{d.answering_h}</h2><p>{d.answering_p}</p></div><div className="quota-mini">{Object.values(ARCH).map((arch) => <span key={arch.label}>{lang === "en" ? arch.label_en : arch.label}<strong className="mono">{arch.n}</strong></span>)}</div></section>
  </div>;
}
