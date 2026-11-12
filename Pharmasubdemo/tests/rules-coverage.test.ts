import { describe, expect, test } from "vitest";
import { cases } from "@/domain/data";
import { buildAdvice } from "@/domain/engine";
import { chainRow, demoSeedInputs, verifyRows } from "@/domain/hashchain";
import type { AuditRow } from "@/domain/types";

const all = cases.flatMap((c) => buildAdvice(c).chains.map((chain) => ({ c, chain })));
const fired = (rule: string) => all.filter(({ chain }) => chain.reject_rule === rule || chain.secondary_rules.includes(rule));

describe("rule coverage: every refusal rule is demonstrable", () => {
  for (const rule of ["P-SUB-01", "P-CI-01", "P-PAEDI-01", "P-STR-02", "P-STR-01", "P-IMPORT-01", "P-REIMB-01", "P-UNKNOWN-01"]) {
    test(`${rule} fires at least once in the demo data`, () => expect(fired(rule).length).toBeGreaterThan(0));
  }
  test("niet_vergoed exists and is never presented as valid", () => {
    const negative = all.filter(({ chain }) => chain.reimbursement === "niet_vergoed");
    expect(negative.length).toBeGreaterThan(0);
    expect(negative.every(({ chain }) => chain.status === "afgewezen")).toBe(true);
  });
  test("an import without citation is emitted as a visible refusal, never valid", () => {
    const imports = all.filter(({ chain }) => chain.chain[0]?.route === "import" && !chain.chain[0].foreign_registration);
    expect(imports.length).toBeGreaterThan(0);
    expect(imports.every(({ chain }) => chain.status === "afgewezen" && chain.reject_rule === "P-IMPORT-01")).toBe(true);
  });
  test("narrow-index strength changes are refused", () => {
    const { chain } = all.find(({ c, chain }) => c.case_id === "C-007" && chain.chain[0]?.strength === "25 mcg")!;
    expect(chain.status).toBe("afgewezen");
  });
});

describe("audit hash chain (pure)", () => {
  test("tampering with any row is detected at exactly that row", () => {
    const rows: AuditRow[] = [];
    for (const input of demoSeedInputs()) rows.push(chainRow(rows.at(-1), input));
    expect(verifyRows(rows).brokenAt).toBeNull();
    rows[2] = { ...rows[2], actor: "mallory" };
    expect(verifyRows(rows).brokenAt).toBe(3);
  });
});
