import { generateChains } from "./chains";
import { substanceTable } from "./data";
import { evaluate, unknownSubstance } from "./gate";
import { gpMessage, patientText } from "./letters";
import { refusalSentence } from "./refusals";
import type { Approved, Case, ChainVerdict, Edit, SubstitutionAdvice } from "./types";

export function buildAdvice(c: Case): SubstitutionAdvice {
  const substance = substanceTable[c.substance];
  let chains: ChainVerdict[];
  if (!substance) {
    chains = [unknownSubstance(c)];
  } else if (c.therapeutic_need) {
    chains = [{
      chain_id: `${c.case_id}-THERAPIE`, chain: [], status: "afgewezen", rules_passed: [],
      reject_rule: "P-SUB-01", reject_reason_nl: refusalSentence("P-SUB-01", c), secondary_rules: [],
      reimbursement: "onbekend", reimbursement_source: null, sources: [substance.source],
    }];
  } else {
    chains = generateChains(c, substanceTable).map((link, index) =>
      evaluate([link], c, substanceTable, `${c.case_id}-CH-${String(index + 1).padStart(2, "0")}`),
    );
  }
  const valid = chains.filter((chain) => chain.status === "geldig");
  return {
    case: c,
    chains,
    top: valid[0]?.chain_id || null,
    refusals: chains.filter((chain) => chain.status !== "geldig"),
    gp_message_nl: "",
    patient_text_nl: "",
    needs_pharmacist: true,
    approved: null,
  };
}

export function withApproval(advice: SubstitutionAdvice, approval: Approved, edits: Edit[] = []): SubstitutionAdvice {
  const gp = gpMessage(advice.case, advice.chains, approval);
  const patient = patientText(advice.chains, approval);
  const gpEdit = edits.filter((edit) => edit.field === "gp_message").at(-1);
  const patientEdit = edits.filter((edit) => edit.field === "patient_text").at(-1);
  return {
    ...advice,
    gp_message_nl: gpEdit?.to ?? gp,
    patient_text_nl: patientEdit?.to ?? patient,
    approved: { chain_id: approval.chain_id, by: approval.by, at: approval.at, edits },
  };
}
