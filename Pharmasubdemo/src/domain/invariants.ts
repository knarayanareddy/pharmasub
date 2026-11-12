import { RULES } from "./rules";
import type { SubstitutionAdvice } from "./types";

export function assertAdvice(advice: SubstitutionAdvice): void {
  if (advice.needs_pharmacist !== true) throw new Error("Menselijke goedkeuring ontbreekt");
  for (const chain of advice.chains) {
    if (chain.status === "afgewezen" && (!chain.reject_rule || !(chain.reject_rule in RULES) || !chain.reject_reason_nl || chain.reject_reason_nl.length <= 25)) {
      throw new Error(`Onvolledige weigering: ${chain.chain_id}`);
    }
    for (const link of chain.chain) {
      if (link.substance !== advice.case.substance) throw new Error("P-SUB-01");
      if (chain.status === "geldig" && link.route === "import" && !link.foreign_registration) throw new Error("P-IMPORT-01");
    }
  }
}
