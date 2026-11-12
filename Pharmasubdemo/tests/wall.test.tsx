import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { RefusalRow } from "@/components/RefusalRow";
import { cases, substanceTable } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import { chainRow, demoSeedInputs, verifyRows } from "@/domain/hashchain";
import type { AuditRow } from "@/domain/types";
import { RULES } from "@/domain/rules";
import { createApproval } from "@/domain/types";
import { normalizeCase, parseNotice } from "@/domain/intake";
import { POST as chainPost } from "@/app/api/chain/route";
import patients from "@data/patients.json";

const advices = cases.map(buildAdvice);
const srcFiles = (directory: string): string[] => readdirSync(directory).flatMap((entry) => {
  const path = join(directory, entry);
  return statSync(path).isDirectory() ? srcFiles(path) : path.match(/\.(ts|tsx)$/) ? [path] : [];
});
const sourceText = srcFiles(resolve("src")).map((path) => readFileSync(path, "utf8")).join("\n");

describe("De muur: T-01 t/m T-20", () => {
  test("T-01 · geen beoordeling van een persoon", () => {
    const forbidden = ["patient_risk", "adherence_score", "likelihood_score", "patient_cost", "appropriateness"];
    expect(sourceText).not.toMatch(new RegExp(forbidden.join("|"), "i"));
  });
  test("T-02 · melding wordt nooit gescoord", () => {
    expect(sourceText).not.toMatch(/notice.*(score|rating)|score.*notice/i);
    expect(cases.every((c) => typeof c.notice_ref === "string")).toBe(true);
    const extracted = parseNotice("Salbutamol 100 mcg inhalatiepoeder, 200 doses. Verzekeraar CZ.");
    expect(extracted).toMatchObject({ substance: "salbutamol", strength: "100 mcg", form: "inhalatiepoeder", package: "200 doses", insurer: "CZ", fields_found: 5 });
  });
  test("T-03 · geen auteurschapsdetectie", () => { expect(sourceText).not.toMatch(/ai.?text.?detector|authorship.?detector/i); });
  test("T-04 · geen beeldclassificatie of upload", () => { expect(sourceText).not.toMatch(/image.?classif|prescription.?image|type=.image\//i); });
  test("T-05 · geen telefoon- of identiteitslaag", () => { expect(sourceText).not.toMatch(/phone_number|bsn|social_security/i); });
  test("T-06 · alleen flags en leeftijdsband in patiëntdata", () => {
    expect(patients.every((patient) => patient.synthetic && !("name" in patient) && !("dob" in patient) && !("address" in patient))).toBe(true);
    expect(cases.every((c) => Array.isArray(c.patient_flags) && typeof c.age_band === "string")).toBe(true);
    const normalized = normalizeCase({ case_id: "X-TEST", substance: "salbutamol", strength: "100 mcg", form: "inhalatiepoeder", package: "200 doses", patient_flags: [], insurer: "CZ", age_band: "18-64", name: "niet bewaren" });
    expect(normalized && !("name" in normalized)).toBe(true);
  });
  test("T-07 · geen bestel- of afleverendpoint", () => {
    expect(readdirSync(resolve("src/app/api"))).not.toContain("order");
    expect(readdirSync(resolve("src/app/api"))).not.toContain("dispense");
  });
  test("T-08 · niets wordt verzonden", () => {
    expect(RULES["P-NOSEND-01"]).toContain("niets");
    expect(sourceText).not.toMatch(/smtp|sendmail|nodemailer/i);
  });
  test("T-09 · iedere weigering heeft regel en specifieke Nederlandse reden", () => {
    for (const advice of advices) for (const refusal of advice.refusals.filter((item) => item.status === "afgewezen")) {
      expect(refusal.reject_rule && refusal.reject_rule in RULES).toBe(true);
      expect((refusal.reject_reason_nl || "").length).toBeGreaterThan(25);
    }
  });
  test("T-10 · geen document zonder namelijk goedkeurende apotheker", () => {
    expect(advices.every((advice) => advice.needs_pharmacist === true)).toBe(true);
    expect(advices.every((advice) => advice.gp_message_nl === "" && advice.patient_text_nl === "")).toBe(true);
    expect(() => createApproval("chain", "", new Date().toISOString())).toThrow("E-APPROVAL-01");
  });
  test("T-11 · onbekend wordt nooit groen of geldig", () => {
    for (const advice of advices) for (const chain of advice.chains.filter((item) => item.reimbursement === "onbekend")) {
      expect(chain.status).not.toBe("geldig");
      const html = renderToStaticMarkup(<RefusalRow verdict={chain} index={0} />);
      expect(html).toContain("ONBEKEND");
      expect(html).not.toContain("status-badge valid");
    }
  });
  test("T-12 · ieder bronveld heeft document, datum en hash", () => {
    for (const advice of advices) for (const chain of advice.chains.filter((item) => item.status === "geldig")) {
      expect(chain.sources.length).toBeGreaterThan(0);
      for (const source of chain.sources) { expect(source.doc.length).toBeGreaterThan(5); expect(source.date).toMatch(/2026-/); expect(source.sha256).toHaveLength(64); }
    }
  });
  test("T-13 · keten-generatie schrijft niet", async () => {
    const source = readFileSync(resolve("src/app/api/chain/route.ts"), "utf8");
    expect(source).not.toMatch(/hashchain|appendAudit/);
    const response = await chainPost(new Request("http://local/api/chain", { method: "POST", body: JSON.stringify({ case_id: "C-004" }) }));
    expect(response.status).toBe(200); expect(response.headers.get("X-Audit-Write")).toBe("false");
  });
  test("T-14 · generatie is byte-identiek over alle 30 casussen", () => {
    for (const c of cases) expect(JSON.stringify(buildAdvice(c).chains)).toBe(JSON.stringify(buildAdvice(c).chains));
  });
  const seeded = () => { const rows: AuditRow[] = []; for (const input of demoSeedInputs()) rows.push(chainRow(rows.at(-1), input)); return rows; };
  test("T-15 · volgnummers zijn aaneengesloten en uniek", () => {
    const rows = seeded();
    for (let index = 0; index < 9; index++) rows.push(chainRow(rows.at(-1), { actor: "test", action: "CASE_OPENED", subject: `C-${index}`, payload: { index } }));
    expect(rows.map((row) => row.seq)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    expect(verifyRows(rows).brokenAt).toBeNull();
  });
  test("T-16 · manipulatie van regel 7 wordt gevonden en reset herstelt", () => {
    const rows = seeded();
    rows[6] = { ...rows[6], payload: { ...rows[6].payload, note: "AANGEPAST ZONDER NIEUWE HASH" } };
    expect(verifyRows(rows)).toEqual({ total: 8, verified: 6, brokenAt: 7 });
    expect(verifyRows(seeded())).toEqual({ total: 8, verified: 8, brokenAt: null });
  });
  test("T-17 · klinische routes importeren geen simulatiecode", () => {
    for (const route of ["case", "chain", "approve"]) {
      const directory = resolve(`src/app/api/${route}`);
      expect(srcFiles(directory).map((path) => readFileSync(path, "utf8")).join("\n")).not.toContain("domain/swarm");
    }
  });
  test("T-18 · import heeft altijd een buitenlandse registratie", () => {
    expect(advices.flatMap((advice) => advice.chains).filter((chain) => chain.status === "geldig").flatMap((chain) => chain.chain).filter((link) => link.route === "import").every((link) => Boolean(link.foreign_registration))).toBe(true);
  });
  test("T-19 · geen enkele keten verandert van werkzame stof", () => {
    for (const advice of advices) expect(advice.chains.flatMap((chain) => chain.chain).every((link) => link.substance === advice.case.substance)).toBe(true);
  });
  test("T-20 · tien nul-antwoordcasussen hebben exact nul geldige ketens", () => {
    const zero = advices.filter((advice) => advice.case.expected?.valid_max === 0);
    expect(zero).toHaveLength(10);
    expect(zero.every((advice) => advice.chains.every((chain) => chain.status !== "geldig"))).toBe(true);
    expect(Object.keys(substanceTable)).toHaveLength(20);
  });
});
