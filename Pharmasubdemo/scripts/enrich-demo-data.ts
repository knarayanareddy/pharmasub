/**
 * One-off, deterministic enrichment of the synthetic demo data so that every rule the
 * gate claims can actually be shown (see SPEC-REVIEW.md §2, gaps 1, 2 and 5).
 * Run: npx tsx scripts/enrich-demo-data.ts   (idempotent)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = (p: string) => resolve(process.cwd(), "data", p);
const read = (p: string) => JSON.parse(readFileSync(file(p), "utf8"));
const write = (p: string, v: unknown) => writeFileSync(file(p), JSON.stringify(v, null, 2) + "\n");
const sha = (v: string) => createHash("sha256").update(v).digest("hex");

const substances = read("substances.json");

// 1 · P-IMPORT-01 — an EU import that cannot cite a foreign registration.
const salbutamol = substances.salbutamol;
const importName = "Salbutamol Parallel 100 mcg inhalatiepoeder";
if (!salbutamol.products.some((p: { product: string }) => p.product === importName)) {
  const source = {
    doc: `SmPC ${importName} §4.2 · voorbeelddata — geen officiële lijst`,
    field: "buitenlandse registratie ontbreekt",
    date: "2026-09-01",
    sha256: sha(`salbutamol|${importName}|buitenlandse registratie ontbreekt`),
    quote_nl: "Synthetisch extract: parallelimport zonder citeerbaar registratienummer.",
  };
  salbutamol.products.push({
    product: importName, substance: "salbutamol", strength: "100 mcg", form: "inhalatiepoeder", packages: ["200 doses"],
    nl_registered: false, eu_registered: true, foreign_registration: null, adult_only: false, contra_indications: {},
    smpc_ref: "smpc/salbutamol.json", source,
  });
  const smpc = read("smpc/salbutamol.json");
  smpc.fields.push({ field: source.field, value: { strength: "100 mcg", form: "inhalatiepoeder", adult_only: false }, doc: source.doc, date: source.date, sha256: source.sha256, quote_nl: source.quote_nl });
  write("smpc/salbutamol.json", smpc);
}

// 2 · P-CI-01 for the renal flag on C-008 (sertraline 25 mg carries a renal caution in the extract).
for (const p of substances.sertraline.products) if (p.strength === "25 mg") p.contra_indications = { renaal: true };
write("substances.json", substances);

// 3 · Reimbursement negatives: flag a few second-choice products as `niet_vergoed`.
const flips: Array<[string, string]> = [
  ["cz", "Metformine"], ["menzis", "Metformine"], ["vgz", "Atorvastatine"],
  ["cz", "Levothyroxine"], ["menzis", "Escitalopram"], ["vgz", "Naproxen"],
];
for (const [insurer, prefix] of flips) {
  const path = `preference/2026-${insurer}.json`;
  const pref = read(path);
  const candidates = pref.entries.filter((e: { product: string; status: string }) => e.product.startsWith(prefix));
  // flip the import / non-first product so a reimbursed alternative always remains
  const target = candidates.find((e: { product: string }) => !/Demo|Pharmaplus/.test(e.product)) ?? candidates.at(-1);
  if (target) target.status = "niet_vergoed";
  write(path, pref);
}
console.log("demo data enriched");
