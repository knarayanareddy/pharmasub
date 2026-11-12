import { DIMENSIONS } from "./archetypes";
import type { Persona } from "./personas";
import { clamp, mulberry32 } from "./rng";

export const COVERAGE = [
  ["N1", "Is weigeren acceptabel?", "✗", "refuse, q_refuse"],
  ["N2", "Is één hop de juiste grens?", "✗", "hops, q_hops"],
  ["N3", "Wie betaalt?", "deels", "payer"],
  ["N4", "Accepteert de huisarts een bericht?", "✗", "gp"],
  ["N5", "Is ‘onbekend’ houdbaar?", "✗", "unknown, q_unknown"],
  ["N6", "Hoe lang duurt een geval?", "deels", "q_minutes"],
  ["N7", "Wat is de eerste frustratie?", "✗", "q_first"],
  ["N8", "Vertrouwt men regels of leverancier?", "✗", "q_trust"],
  ["N9", "Werkt uitleg op B1?", "✗", "patient"],
  ["N10", "Wat veroorzaakt churn?", "✗", "q_stop"],
];

export const COVERAGE_EN = [
  ["N1", "Is refusal acceptable?", "✗", "refuse, q_refuse"],
  ["N2", "Is one hop the right limit?", "✗", "hops, q_hops"],
  ["N3", "Who pays?", "partial", "payer"],
  ["N4", "Will a GP accept a message?", "✗", "gp"],
  ["N5", "Is ‘unknown’ sustainable?", "✗", "unknown, q_unknown"],
  ["N6", "How long does a case take?", "partial", "q_minutes"],
  ["N7", "What is the first frustration?", "✗", "q_first"],
  ["N8", "Do people trust rules or the supplier?", "✗", "q_trust"],
  ["N9", "Does a B1 explanation work?", "✗", "patient"],
  ["N10", "What causes churn?", "✗", "q_stop"],
];

export const ITEMS_EN = [
  ["role", "Role", "choice"], ["setting", "Work setting", "choice"], ["years", "Years of experience", "choice"],
  ["q_minutes", "How much time does one shortage case take you on average?", "<5 · 5–15 · 15–30 · 30–60 · >60 · don’t know"],
  ["q_first", "What is your first problem in a shortage?", "availability · rules · reimbursement · GP · explanation · admin"],
  ["q_refuse", "When in doubt, should a system refuse or make its best guess?", "scale 1–5"],
  ["q_unknown", "What should a system do when reimbursement is unknown?", "show unknown · assume reimbursed · show nothing · other"],
  ["usefulness", "Which parts are useful?", "matrix: chains · refusals · letters · import"],
  ["q_hops", "How many changes may a proposal make?", "1 · 2 · 3 · doesn’t matter"],
  ["q_trust", "What makes a proposal trustworthy?", "pharmacist · source · supplier · inspectorate"],
  ["q_gp", "How does the GP want to hear about a substitution?", "by phone · in the GP system · email · not at all"],
  ["intent", "How likely are you to use this next month?", "scale 0–10"],
  ["patient", "How important is a B1 explanation in a substitution?", "scale 1–5"],
  ["q_stop", "What would put you off?", "trust in rules · workload · integration · cost · nothing"],
];

export const ITEMS = [
  ["role", "Rol", "keuze"], ["setting", "Werksetting", "keuze"], ["years", "Jaren ervaring", "keuze"],
  ["q_minutes", "Hoeveel tijd kost één tekortgeval u gemiddeld?", "<5 · 5–15 · 15–30 · 30–60 · >60 · weet niet"],
  ["q_first", "Wat is bij een tekort uw eerste probleem?", "beschikbaarheid · regels · vergoeding · huisarts · uitleg · administratie"],
  ["q_refuse", "Moet een systeem bij twijfel weigeren of een beste gok doen?", "schaal 1–5"],
  ["q_unknown", "Wat moet een systeem doen als de vergoeding onbekend is?", "onbekend tonen · aannemen · niets tonen · anders"],
  ["usefulness", "Welke onderdelen zijn nuttig?", "matrix: ketens · weigeringen · brieven · import"],
  ["q_hops", "Hoeveel wijzigingen mag een voorstel doen?", "1 · 2 · 3 · maakt niet uit"],
  ["q_trust", "Wat maakt een voorstel betrouwbaar?", "apotheker · bron · leverancier · inspectie"],
  ["q_gp", "Hoe wil de huisarts bericht krijgen?", "telefonisch · HIS · e-mail · niet"],
  ["intent", "Hoe waarschijnlijk gebruikt u dit volgende maand?", "schaal 0–10"],
  ["patient", "Hoe belangrijk is uitleg op B1-niveau?", "schaal 1–5"],
  ["q_stop", "Wat zou u ervan weerhouden?", "vertrouwen · werkdruk · AIS · kosten · niets"],
];

const likert5 = (value: number) => clamp(1 + Math.round(value * 4), 1, 5);

export function answerInstrument(personas: Persona[], seed = 20261111) {
  const rnd = mulberry32(seed);
  return personas.map((persona) => {
    const abstain = rnd() < .06 + .30 * (1 - persona.priors.unknown);
    const minutes = persona.pharmacy_type === "keten" ? "5-15" : persona.pharmacy_type === "zelfstandig" ? "30-60" : "15-30";
    return {
      id: persona.id, archetype: persona.archetype, synthetic: true,
      q_minutes: abstain ? "zeg ik liever niet" : minutes,
      q_first: persona.priors.payer > .55 ? "vergoeding" : "wet- en regelgeving",
      q_refuse: abstain ? "zeg ik liever niet" : likert5(persona.priors.refuse),
      q_unknown: abstain ? "zeg ik liever niet" : persona.priors.unknown > .5 ? "onbekend tonen" : "anders",
      q_hops: persona.priors.hops > .65 ? "1" : persona.priors.hops > .45 ? "2" : "3",
      q_trust: persona.priors.refuse > .6 ? "de geciteerde bron" : "de apotheker die het goedkeurt",
      q_gp: persona.priors.gp > .5 ? "bericht in het HIS" : "telefonisch",
      intent: Math.round(persona.priors.refuse * 6 + persona.priors.payer * 4),
      patient: likert5(persona.priors.patient),
      q_stop: persona.priors.unknown < .45 ? "vertrouwen in de regels" : "integratie met het AIS",
    };
  });
}

export function surveyCsv(personas: Persona[], version: "v1" | "v2") {
  const rows = answerInstrument(personas);
  if (version === "v1") return "id,archetype,frustration,likely_use,feature\n" + rows.map((row) => `${row.id},${row.archetype},tekort,${row.intent},ketens`).join("\n");
  const headers = Object.keys(rows[0]);
  return headers.join(",") + "\n" + rows.map((row) => headers.map((key) => JSON.stringify(String(row[key as keyof typeof row]))).join(",")).join("\n");
}

export const DIMENSION_LABELS = Object.fromEntries(DIMENSIONS.map((dim) => [dim.id, dim.label]));
