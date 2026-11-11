import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const source = (substance, product, field = "product en toedieningsvorm") => ({
  doc: `SmPC ${product} §4.2 · voorbeelddata — geen officiële lijst`,
  field,
  date: "2026-09-01",
  sha256: sha256(`${substance}|${product}|${field}`),
  quote_nl: "Synthetisch SmPC-extract voor demonstratie van de regellogica.",
});

const definitions = [
  ["salbutamol", "R03AC02", "100 mcg", "inhalatiepoeder", "200 doses", "2 mg/5 ml", "drank", "150 ml"],
  ["metformine", "A10BA02", "500 mg", "tablet", "90 tabletten", "850 mg", "tablet", "60 tabletten"],
  ["atorvastatine", "C10AA05", "20 mg", "tablet", "30 tabletten", "40 mg", "tablet", "30 tabletten"],
  ["omeprazol", "A02BC01", "20 mg", "maagsapresistente capsule", "28 capsules", "40 mg", "maagsapresistente capsule", "28 capsules"],
  ["amoxicilline", "J01CA04", "500 mg", "capsule", "21 capsules", "250 mg/5 ml", "drank", "100 ml"],
  ["levothyroxine", "H03AA01", "50 mcg", "tablet", "90 tabletten", "25 mcg", "tablet", "90 tabletten"],
  ["sertraline", "N06AB06", "50 mg", "tablet", "30 tabletten", "25 mg", "tablet", "30 tabletten"],
  ["oxycodon", "N02AA05", "5 mg", "capsule", "28 capsules", "10 mg", "capsule", "28 capsules"],
  ["furosemide", "C03CA01", "40 mg", "tablet", "30 tabletten", "20 mg", "tablet", "30 tabletten"],
  ["prednison", "H02AB07", "5 mg", "tablet", "30 tabletten", "1 mg", "tablet", "30 tabletten"],
  ["insuline glargine", "A10AE04", "100 E/ml", "injectievloeistof", "5 pennen", "300 E/ml", "injectievloeistof", "5 pennen"],
  ["methylfenidaat", "N06BA04", "10 mg", "tablet", "30 tabletten", "18 mg", "tablet met gereguleerde afgifte", "30 tabletten"],
  ["tamsulosine", "G04CA02", "0,4 mg", "capsule met gereguleerde afgifte", "30 capsules", "0,4 mg", "tablet met gereguleerde afgifte", "30 tabletten"],
  ["escitalopram", "N06AB10", "10 mg", "tablet", "28 tabletten", "20 mg", "tablet", "28 tabletten"],
  ["naproxen", "M01AE02", "250 mg", "tablet", "30 tabletten", "500 mg", "tablet", "30 tabletten"],
  ["paracetamol (zetpil)", "N02BE01", "500 mg", "zetpil", "10 zetpillen", "1000 mg", "zetpil", "10 zetpillen"],
  ["amoxicilline/clavulaanzuur", "J01CR02", "500/125 mg", "tablet", "21 tabletten", "875/125 mg", "tablet", "21 tabletten"],
  ["hydrochloorthiazide", "C03AA03", "25 mg", "tablet", "30 tabletten", "12,5 mg", "tablet", "30 tabletten"],
  ["pantoprazol", "A02BC02", "20 mg", "maagsapresistente tablet", "28 tabletten", "40 mg", "maagsapresistente tablet", "28 tabletten"],
  ["azitromycine", "J01FA10", "250 mg", "tablet", "6 tabletten", "500 mg", "tablet", "3 tabletten"],
];

const flags = {
  amoxicilline: { allergie_penicilline: true },
  "amoxicilline/clavulaanzuur": { allergie_penicilline: true },
  naproxen: { allergie_nsaid: true },
};
const labels = {
  "paracetamol (zetpil)": "Paracetamol",
  "amoxicilline/clavulaanzuur": "Amoxicilline/clavulaanzuur",
  "insuline glargine": "Insuline glargine",
  "hydrochloorthiazide": "Hydrochloorthiazide",
};
const title = (s) => (labels[s] || s).replace(/^./, (c) => c.toUpperCase());
const table = {};

for (const [substance, atc, strength, form, pkg, strength2, form2, pkg2] of definitions) {
  const name = title(substance);
  const ci = flags[substance] || {};
  const original = `${name} Demo ${strength} ${form}`;
  const alternative = `${name} Pharmaplus ${strength} ${substance === "salbutamol" ? "aerosol" : form}`;
  const changed = `${name} Sandoz ${strength2} ${form2}`;
  const altForm = substance === "salbutamol" ? "aerosol" : form;
  const products = [
    {
      product: original, substance, strength, form, packages: [pkg], nl_registered: true,
      eu_registered: true, foreign_registration: null, adult_only: substance === "oxycodon",
      contra_indications: ci, smpc_ref: `smpc/${substance.replaceAll("/", "-")}.json`, source: source(substance, original),
    },
    {
      product: alternative, substance, strength, form: altForm, packages: [pkg], nl_registered: true,
      eu_registered: true, foreign_registration: null, adult_only: substance === "oxycodon",
      contra_indications: ci, smpc_ref: `smpc/${substance.replaceAll("/", "-")}.json`, source: source(substance, alternative),
    },
    {
      product: changed, substance, strength: strength2, form: form2, packages: [pkg2], nl_registered: true,
      eu_registered: true, foreign_registration: null, adult_only: substance === "oxycodon",
      contra_indications: ci, smpc_ref: `smpc/${substance.replaceAll("/", "-")}.json`, source: source(substance, changed),
    },
  ];
  if (["salbutamol", "metformine", "atorvastatine", "omeprazol", "pantoprazol"].includes(substance)) {
    const imported = `${name} EU ${strength} ${form}`;
    products.push({
      product: imported, substance, strength, form, packages: [pkg], nl_registered: false,
      eu_registered: true, foreign_registration: `EU/1/26/DEMO/${String(products.length + 1).padStart(3, "0")}`,
      adult_only: false, contra_indications: ci, smpc_ref: `smpc/${substance.replaceAll("/", "-")}.json`,
      source: source(substance, imported, "buitenlandse registratie"),
    });
  }
  const eq = {};
  const forms = new Set([form, altForm, form2]);
  for (const target of forms) {
    const equivalent = !(substance === "salbutamol" && target === "drank");
    eq[`${form}|${target}`] = {
      equivalent,
      rule: equivalent ? "P-STR-01" : "P-STR-02",
      note_nl: equivalent
        ? "zelfde dosisinterval volgens het synthetische SmPC-extract — apotheker controleert sterkte en toedieningsvorm"
        : `${changed} heeft een ander dosisinterval dan ${strength} ${form} — niet uitwisselbaar zonder controle`,
    };
  }
  table[substance] = { substance, atc, products, dose_interval_equivalence: eq, contra_indications: ci, source: source(substance, name, "INN en ATC") };
  writeFileSync(`data/smpc/${substance.replaceAll("/", "-")}.json`, JSON.stringify({
    substance,
    label: "voorbeelddata — geen officiële lijst",
    fields: products.map((p) => ({ field: p.product, value: { strength: p.strength, form: p.form, adult_only: p.adult_only }, ...p.source })),
  }, null, 2) + "\n");
}
writeFileSync("data/substances.json", JSON.stringify(table, null, 2) + "\n");

const preferenceProducts = (insurer) => Object.values(table).flatMap((s) => s.products.map((p, index) => ({
  product: p.product,
  substance: p.substance,
  status: insurer === "CZ" && p.substance === "salbutamol" && p.route === "import" ? "onbekend" : "vergoed",
  peildatum: insurer === "CZ" ? "2026-10-01" : insurer === "VGZ" ? "2026-09-15" : "2026-08-01",
  source: `Preferentielijst ${insurer} 2026 · voorbeelddata — geen officiële lijst`,
}))).filter((p) => !(p.substance === "salbutamol" && p.product.includes("EU") && p.status !== "niet_vergoed"));
for (const insurer of ["CZ", "VGZ", "Menzis"]) {
  const entries = preferenceProducts(insurer).filter((p) => !(insurer === "CZ" && p.substance === "salbutamol" && p.product.includes("EU")));
  writeFileSync(`data/preference/2026-${insurer.toLowerCase()}.json`, JSON.stringify({
    insurer, list: `Preferentiebeleid ${insurer} 2026 · voorbeelddata — geen officiële lijst`,
    peildatum: insurer === "CZ" ? "2026-10-01" : insurer === "VGZ" ? "2026-09-15" : "2026-08-01",
    entries,
  }, null, 2) + "\n");
}

const same = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11];
const strengthCases = [4, 12, 13, 14, 15, 16, 18, 19, 20, 21];
const noSafe = [17, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const caseSubstances = {
  1: "salbutamol", 2: "metformine", 3: "atorvastatine", 4: "salbutamol", 5: "omeprazol",
  6: "amoxicilline", 7: "levothyroxine", 8: "sertraline", 9: "oxycodon", 10: "furosemide",
  11: "prednison", 12: "methylfenidaat", 13: "tamsulosine", 14: "escitalopram", 15: "naproxen",
  16: "paracetamol (zetpil)", 17: "salbutamol", 18: "amoxicilline/clavulaanzuur",
  19: "hydrochloorthiazide", 20: "pantoprazol", 21: "azitromycine", 22: "onbekende stof",
  23: "amoxicilline", 24: "naproxen", 25: "oxycodon", 26: "atorvastatine", 27: "omeprazol",
  28: "niet-geregistreerde stof", 29: "amoxicilline/clavulaanzuur", 30: "insuline glargine",
};
const cases = [];
for (let n = 1; n <= 30; n++) {
  const id = `C-${String(n).padStart(3, "0")}`;
  const substance = caseSubstances[n];
  const s = table[substance];
  const original = s?.products[0];
  const patient_flags = [];
  let age_band = n % 5 === 0 ? "65+" : "18-64";
  if ([23, 29].includes(n)) patient_flags.push("allergie_penicilline");
  if (n === 24) patient_flags.push("allergie_nsaid");
  if (n === 25) { patient_flags.push("pediatrisch"); age_band = "0-11"; }
  if (n === 8) patient_flags.push("renaal");
  const therapeutic_need = [26, 27, 30].includes(n);
  const unknown = !s;
  const expectedRules = noSafe.includes(n)
    ? n === 17 ? ["P-STR-01", "P-REIMB-01"]
      : unknown ? ["P-UNKNOWN-01"]
      : therapeutic_need ? ["P-SUB-01"]
      : n === 25 ? ["P-PAEDI-01"] : ["P-CI-01"]
    : n === 4 ? ["P-STR-01"] : [];
  cases.push({
    case_id: id, substance, atc: s?.atc || "ONBEKEND", strength: original?.strength || "onbekend",
    form: original?.form || "onbekend", package: original?.packages[0] || "onbekend",
    patient_flags, insurer: n === 17 ? "onbekend" : n % 3 === 0 ? "VGZ" : n % 3 === 1 ? "CZ" : "Menzis",
    notice_ref: `notices/${id.toLowerCase()}.txt`, age_band,
    ...(therapeutic_need ? { therapeutic_need: true } : {}),
    expected: { valid_min: noSafe.includes(n) ? 0 : 1, valid_max: noSafe.includes(n) ? 0 : 9, must_reject_rules: expectedRules },
  });
  writeFileSync(`data/notices/${id.toLowerCase()}.txt`,
    `SYNTHETISCHE MELDING ${id}\nStof: ${substance}\nVoorgeschreven: ${original?.strength || "onbekend"} ${original?.form || "onbekend"}\nMelding: levering van het voorgeschreven product is tijdelijk niet mogelijk.\nVraag: beoordeel uitsluitend alternatieven met dezelfde werkzame stof.\nPeildatum melding: 2026-11-01\n`);
}
writeFileSync("data/cases.json", JSON.stringify(cases, null, 2) + "\n");
writeFileSync("data/patients.json", JSON.stringify(cases.map((c) => ({ case_id: c.case_id, age_band: c.age_band, flags: c.patient_flags, synthetic: true })), null, 2) + "\n");
writeFileSync("data/swarm/falsifiers.json", JSON.stringify([
  { id: "F1", claim: "Apothekers verkiezen een zichtbare weigering boven een ogenschijnlijk zekere gok.", test: "QREFUSE", expected: true, if_false: "De kernthese valt weg. Herbouw rond een verplichte menselijke controle zonder weigeringsclaim." },
  { id: "F2", claim: "De één-hopgrens overleeft een publieke afleverfout.", test: "QFOUT", expected: true, if_false: "Maak de grens een configureerbaar protocol in plaats van een vaste productregel." },
  { id: "F3", claim: "Apothekers tolereren ‘onbekend’.", test: "QUNKNOWN", expected: true, if_false: "Lost elke vergoedingsstatus op met gelicentieerde bronnen voordat het product wordt gebruikt." },
  { id: "F4", claim: "Huisartsen accepteren een bericht in plaats van een gesprek.", test: "QGP", expected: true, if_false: "Beperk de workflowbelofte tot de apotheek; het huisartsenbericht is dan geen propositie." },
  { id: "F5", claim: "Toelevering en inspectie verschillen meer over dekking dan apothekers.", test: "DIVERGE", expected: true, if_false: "Vertel het verhaal over de positie tussen groothandel en inspectie niet." },
], null, 2) + "\n");
console.log(`Seeded ${Object.keys(table).length} substances, ${cases.length} cases and ${same.length + strengthCases.length + noSafe.length} scenario assignments.`);
