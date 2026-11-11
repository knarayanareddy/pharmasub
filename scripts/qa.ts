import { cases } from "../src/domain/data";
import { buildAdvice } from "../src/domain/engine";
import { assertAdvice } from "../src/domain/invariants";

let failed = 0;
let covered = 0;
let valid = 0;
let refused = 0;
for (const c of cases) {
  const advice = buildAdvice(c);
  assertAdvice(advice);
  const count = advice.chains.filter((chain) => chain.status === "geldig").length;
  const rules = new Set(advice.refusals.map((chain) => chain.reject_rule));
  const okay = count >= (c.expected?.valid_min || 0) && count <= (c.expected?.valid_max ?? 99) && (c.expected?.must_reject_rules || []).every((rule) => rules.has(rule));
  if (!okay) {
    failed++;
    console.error(`${c.case_id}: valid=${count}, expected=${JSON.stringify(c.expected)}, refusals=${[...rules].join(",")}`);
  }
  if (count > 0) covered++;
  valid += count;
  refused += advice.refusals.length;
}
console.log(`\n${cases.length} casussen · ${covered} met geldige keten · ${valid} geldige ketens · ${refused} zichtbare weigeringen/onbekenden`);
console.log(`Dekking: ${Math.round(covered / cases.length * 100)}% · onveilige geldige ketens in nul-antwoordcasussen: ${failed === 0 ? 0 : "controleer fouten"}`);
if (failed) process.exitCode = 1;
