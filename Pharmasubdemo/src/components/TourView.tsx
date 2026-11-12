"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { useLang } from "@/i18n/LanguageProvider";
import { RULES, RULES_EN } from "@/domain/rules";

export interface RuleStat { rule: string; count: number; example: string | null }

interface Step { n: string; href: string; cta: string; title: [string, string]; body: [string, string]; chips: string[] }

const STEPS: Step[] = [
  {
    n: "1", href: "/case/C-004", cta: "C-004", chips: ["P-STR-01", "P-IMPORT-01", "P-REIMB-01"],
    title: ["Een bruikbare keten — en alles wat is geweigerd", "A usable chain — and everything that was refused"],
    body: [
      "Salbutamol (CZ): twee geldige, gerangschikte ketens. De refusal-kolom blijft zichtbaar: de drank (ander dosisinterval), de import zonder citeerbare registratie en een EU-import met onbekende vergoeding. Kies een keten, vul je naam in en keur goed: dan ontgrendelen brief, PDF en JSON.",
      "Salbutamol (CZ): two valid, ranked chains. The refusal column stays visible: the oral solution (different dose interval), the import without a citable registration and an EU import with unknown reimbursement. Pick a chain, enter your name and approve: the letter, PDF and JSON unlock.",
    ],
  },
  {
    n: "2", href: "/case/C-017", cta: "C-017", chips: ["P-STR-01", "P-IMPORT-01", "P-REIMB-01"],
    title: ["Nul geldige ketens is een resultaat", "Zero valid chains is a result"],
    body: [
      "Zelfde middel, onbekende verzekeraar: vergoeding is onbekend, en ‘onbekend’ is nooit ‘vergoed’. Het systeem toont vijf redenen en laat de apotheker beslissen. Er is geen export mogelijk.",
      "Same drug, unknown insurer: reimbursement is unknown, and ‘unknown’ is never ‘reimbursed’. The system shows five reasons and leaves the decision to the pharmacist. No export is possible.",
    ],
  },
  {
    n: "3", href: "/case/C-002", cta: "C-002", chips: ["P-REIMB-01"],
    title: ["Niet vergoed bij deze verzekeraar", "Not reimbursed by this insurer"],
    body: [
      "Metformine (Menzis): een alternatief staat in de momentopname als ‘niet vergoed’ en wordt afgewezen, naast de vergoede alternatieven die wel geldig zijn.",
      "Metformin (Menzis): an alternative is listed as ‘not reimbursed’ in the snapshot and is rejected, alongside the reimbursed alternatives that remain valid.",
    ],
  },
  {
    n: "4", href: "/case/C-006", cta: "C-006", chips: ["P-STR-02"],
    title: ["Twee wijzigingen tegelijk: terug naar de apotheker", "Two simultaneous changes: back to the pharmacist"],
    body: [
      "Amoxicilline capsule → drank wijzigt sterkte én vorm. P-STR-02 weigert dat zichtbaar; ook C-012 (methylfenidaat met gereguleerde afgifte) laat dit zien.",
      "Amoxicillin capsule → oral solution changes strength and form. P-STR-02 visibly refuses it; C-012 (modified-release methylphenidate) shows the same.",
    ],
  },
  {
    n: "5", href: "/case/C-007", cta: "C-007", chips: ["P-STR-01"],
    title: ["Smalle therapeutische breedte", "Narrow therapeutic index"],
    body: [
      "Levothyroxine 50 mcg: een andere sterkte (25 mcg) wordt nooit automatisch uitgewisseld. Hetzelfde geldt voor oxycodon, insuline glargine en methylfenidaat.",
      "Levothyroxine 50 mcg: a different strength (25 mcg) is never auto-interchanged. The same applies to oxycodone, insulin glargine and methylphenidate.",
    ],
  },
  {
    n: "6", href: "/case/C-008", cta: "C-008", chips: ["P-CI-01"],
    title: ["Patiëntflags en contra-indicaties", "Patient flags and contraindications"],
    body: [
      "Sertraline met een renaal-flag: het 25 mg-product wordt afgewezen op een onopgeloste contra-indicatie. Zie ook C-023/C-029 (penicilline-allergie), C-024 (NSAID) en C-025 (pediatrisch, P-PAEDI-01).",
      "Sertraline with a renal flag: the 25 mg product is rejected on an unresolved contraindication. See also C-023/C-029 (penicillin allergy), C-024 (NSAID) and C-025 (paediatric, P-PAEDI-01).",
    ],
  },
  {
    n: "7", href: "/case/C-026", cta: "C-026", chips: ["P-SUB-01", "P-UNKNOWN-01"],
    title: ["Therapiewijziging en onbekende stoffen", "Therapy changes and unknown substances"],
    body: [
      "Een andere werkzame stof is geen substitutie: C-026, C-027 en C-030 worden geweigerd. C-022 en C-028 bevatten een stof buiten de regeltabel — wij raden niet.",
      "A different active substance is not a substitution: C-026, C-027 and C-030 are refused. C-022 and C-028 contain a substance outside the rule table — we do not guess.",
    ],
  },
  {
    n: "8", href: "/intake", cta: "/intake", chips: ["Intake"],
    title: ["Eigen casus invoeren", "Enter your own case"],
    body: [
      "Plak een vrije tekortmelding (NL of EN), kies voorschrift, verzekeraar en synthetische flags. De casus doorloopt dezelfde regelgate, goedkeuring, export en audit.",
      "Paste a free-text shortage notice (NL or EN), choose the prescription, insurer and synthetic flags. The case runs through the same rule gate, approval, export and audit.",
    ],
  },
  {
    n: "9", href: "/verify", cta: "/verify", chips: ["SHA-256"],
    title: ["Het auditspoor in PostgreSQL — en de manipulatiedemo", "The audit trail in PostgreSQL — and the tamper demo"],
    body: [
      "Iedere goedkeuring, weigering en bewerking is een rij in een hash-keten. Pas rij 7 aan: de verifier wijst precies die rij aan en blokkeert exports. Reset herstelt de keten.",
      "Every approval, refusal and edit is a row in a hash chain. Tamper with row 7: the verifier points at exactly that row and blocks exports. Reset restores the chain.",
    ],
  },
  {
    n: "10", href: "/swarm", cta: "/swarm", chips: ["240 persona's", "200 runs"],
    title: ["Simulatielab en instrument", "Swarm lab and instrument"],
    body: [
      "Geen LLM, geen voorspelling: 240 synthetische persona's, 24 rondes, 9 gebeurtenissen en 200 ensemble-runs met Wilson-intervallen. De falsifiers zijn vooraf vastgelegd. Zie ook /instrument.",
      "No LLM, no prediction: 240 synthetic personas, 24 rounds, 9 events and 200 ensemble runs with Wilson intervals. The falsifiers were committed in advance. See also /instrument.",
    ],
  },
];

export function TourView({ rules, totals, audit }: {
  rules: RuleStat[];
  totals: { cases: number; covered: number; valid: number; refused: number };
  audit: { total: number; verified: number; brokenAt: number | null };
}) {
  const { lang } = useLang();
  const i = lang === "en" ? 1 : 0;
  const labels = lang === "en" ? RULES_EN : RULES;
  const structural = new Set(["P-NOSEND-01", "P-SOURCE-01"]);
  return (
    <div className="page tour-page">
      <section className="tour-hero">
        <div className="eyebrow">{i ? "GUIDED TOUR · END TO END" : "RONDLEIDING · VAN BEGIN TOT EIND"}</div>
        <h1>{i ? "Availability is solved. The work is not." : "Beschikbaarheid is opgelost. Het werk niet."}</h1>
        <p>
          {i
            ? "Ten stops show every capability of the demo with synthetic data: deterministic rules, visible refusals, pharmacist approval, export and a tamper-evident audit trail stored in PostgreSQL."
            : "Tien stops laten alle mogelijkheden van de demo zien met synthetische data: deterministische regels, zichtbare weigeringen, goedkeuring door de apotheker, export en een manipulatiebestendig auditspoor in PostgreSQL."}
        </p>
        <div className="tour-totals">
          <div><strong>{totals.covered}/{totals.cases}</strong><span>{i ? "cases with a valid chain" : "casussen met geldige keten"}</span></div>
          <div><strong>{totals.valid}</strong><span>{i ? "valid chains" : "geldige ketens"}</span></div>
          <div><strong>{totals.refused}</strong><span>{i ? "visible refusals" : "zichtbare weigeringen"}</span></div>
          <div className={audit.brokenAt === null ? "ok" : "bad"}>
            <strong>{audit.brokenAt === null ? `${audit.verified}/${audit.total}` : `#${audit.brokenAt}`}</strong>
            <span>{audit.brokenAt === null ? (i ? "audit rows verified" : "auditregels geverifieerd") : (i ? "chain broken at row" : "keten verbroken bij regel")}</span>
          </div>
        </div>
      </section>

      <ol className="tour-steps">
        {STEPS.map((step) => (
          <li key={step.n} className="tour-step panel">
            <span className="tour-num mono">{step.n}</span>
            <div className="tour-body">
              <h2>{step.title[i]}</h2>
              <p>{step.body[i]}</p>
              <div className="tour-chips">{step.chips.map((chip) => <span key={chip} className="rule-chip">{chip}</span>)}</div>
            </div>
            <Link href={step.href} className="btn primary">{step.cta} <ArrowRight size={15} /></Link>
          </li>
        ))}
      </ol>

      <section className="panel tour-rules">
        <h2><ShieldCheck size={18} /> {i ? "Rule coverage — every rule, live from the engine" : "Regeldekking — iedere regel, live uit de engine"}</h2>
        <p className="muted">{i ? "Counted over the 30 synthetic cases when this page loaded. Nothing is hard-coded." : "Geteld over de 30 synthetische casussen bij het laden van deze pagina. Niets is hard-gecodeerd."}</p>
        <table>
          <thead><tr><th>{i ? "Rule" : "Regel"}</th><th>{i ? "Meaning" : "Betekenis"}</th><th>{i ? "Refusals" : "Weigeringen"}</th><th>{i ? "Example" : "Voorbeeld"}</th></tr></thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.rule}>
                <td className="mono">{r.count > 0 ? <CheckCircle2 size={14} className="fired" /> : <CircleDashed size={14} />} {r.rule}</td>
                <td>{labels[r.rule as keyof typeof labels]}</td>
                <td className="mono">{r.count > 0 ? r.count : structural.has(r.rule) ? (i ? "structural" : "structureel") : 0}</td>
                <td>{r.example ? <Link href={`/case/${r.example}`} className="mono">{r.example}</Link> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">{i ? "P-NOSEND-01 is structural (no send endpoint exists); P-SOURCE-01 is defensive — every product in the synthetic data carries a source, so it correctly never fires." : "P-NOSEND-01 is structureel (er bestaat geen verzendendpoint); P-SOURCE-01 is defensief — ieder product in de synthetische data heeft een bron, dus de regel vuurt terecht nooit."}</p>
      </section>
    </div>
  );
}
