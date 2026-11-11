import { preferences } from "./data";
import { notReimbursedSentence, refusalSentence } from "./refusals";
import type { Case, ChainLink, ChainVerdict, Reimbursement, SubstanceTable } from "./types";
import type { RuleId, RuleId as RuleName } from "./rules";

const DEMO_DATE = new Date("2026-11-11T00:00:00Z");

function rejected(id: string, chain: ChainLink[], rule: RuleName, c: Case, passed: string[], sources: ChainVerdict["sources"], reimbursement: Reimbursement = "onbekend", reimbursement_source: ChainVerdict["reimbursement_source"] = null, flag?: Parameters<typeof refusalSentence>[3]): ChainVerdict {
  return {
    chain_id: id, chain, status: rule === "P-REIMB-01" && reimbursement === "onbekend" || rule === "P-SOURCE-01" ? "onbekend" : "afgewezen",
    rules_passed: passed, reject_rule: rule, reject_reason_nl: refusalSentence(rule, c, chain[0], flag),
    secondary_rules: [], reimbursement, reimbursement_source, sources,
  };
}

export function evaluate(chain: ChainLink[], c: Case, table: SubstanceTable, id: string): ChainVerdict {
  const link = chain[0];
  const sources = chain.flatMap((item) => item.source ? [item.source] : []);
  const passed = ["P-SUB-01"];
  if (!link) return rejected(id, chain, "P-SUB-01", c, [], sources);
  if (chain.some((item) => item.substance !== c.substance)) throw new Error("P-SUB-01: andere werkzame stof in keten");

  const substance = table[c.substance];
  const product = substance?.products.find((item) => item.product === link.product);
  for (const flag of c.patient_flags) {
    if (product?.contra_indications[flag] || substance?.contra_indications[flag]) {
      return rejected(id, chain, "P-CI-01", c, passed, sources, "onbekend", null, flag);
    }
  }
  passed.push("P-CI-01");
  if (c.age_band === "0-11" && product?.adult_only) return rejected(id, chain, "P-PAEDI-01", c, passed, sources);
  passed.push("P-PAEDI-01");
  if (chain.length > 1 && !c.allow_two_hops) return rejected(id, chain, "P-STR-02", c, passed, sources);
  passed.push("P-STR-02");

  let equivalenceNote: string | undefined;
  if (link.strength !== c.strength || link.form !== c.form) {
    const equivalence = substance?.dose_interval_equivalence[`${c.form}|${link.form}`];
    if (!equivalence) return rejected(id, chain, "P-SOURCE-01", c, passed, sources);
    equivalenceNote = equivalence.note_nl;
    if (!equivalence.equivalent) {
      const verdict = rejected(id, chain, "P-STR-01", c, passed, sources);
      verdict.reject_reason_nl = equivalence.note_nl;
      verdict.equivalence_note_nl = equivalenceNote;
      return verdict;
    }
  }
  passed.push("P-STR-01");
  if (link.route === "import" && (!link.foreign_registration || product?.nl_registered)) {
    return rejected(id, chain, "P-IMPORT-01", c, passed, sources);
  }
  passed.push("P-IMPORT-01");

  let reimbursement: Reimbursement = "onbekend";
  let reimbursementSource: ChainVerdict["reimbursement_source"] = null;
  if (c.insurer !== "onbekend") {
    const snapshot = preferences[c.insurer];
    const entry = snapshot.entries.find((item) => item.product === link.product);
    const ageMonths = (DEMO_DATE.getTime() - new Date(`${snapshot.peildatum}T00:00:00Z`).getTime()) / (30.44 * 24 * 3600 * 1000);
    reimbursementSource = { insurer: c.insurer, list: snapshot.list, peildatum: snapshot.peildatum };
    if (entry && ageMonths <= 12) reimbursement = entry.status as Reimbursement;
    if (reimbursement === "niet_vergoed") {
      const verdict = rejected(id, chain, "P-REIMB-01", c, passed, sources, reimbursement, reimbursementSource);
      verdict.reject_reason_nl = notReimbursedSentence(link.product, c.insurer);
      return verdict;
    }
    if (reimbursement === "onbekend") return rejected(id, chain, "P-REIMB-01", c, passed, sources, reimbursement, reimbursementSource);
  } else {
    return rejected(id, chain, "P-REIMB-01", c, passed, sources, reimbursement, null);
  }
  passed.push("P-REIMB-01");
  if (!link.source?.doc || !link.source.date || !link.source.sha256) return rejected(id, chain, "P-SOURCE-01", c, passed, sources, reimbursement, reimbursementSource);
  passed.push("P-SOURCE-01");
  return {
    chain_id: id, chain, status: "geldig", rules_passed: passed, reject_rule: null,
    reject_reason_nl: null, secondary_rules: [], reimbursement, reimbursement_source: reimbursementSource,
    sources, equivalence_note_nl: equivalenceNote,
  };
}

export function unknownSubstance(c: Case, id = `${c.case_id}-UNKNOWN`): ChainVerdict {
  return {
    chain_id: id, chain: [], status: "onbekend", rules_passed: [], reject_rule: "P-UNKNOWN-01" satisfies RuleId,
    reject_reason_nl: refusalSentence("P-UNKNOWN-01", c), secondary_rules: [], reimbursement: "onbekend",
    reimbursement_source: null, sources: [],
  };
}
