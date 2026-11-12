import { translateForm, translatePackage, translateProduct, translateSubstance } from "@/i18n/translateData";
import type { Approved, Case, ChainVerdict } from "./types";

function selectedChain(approval: Approved, chains: ChainVerdict[]): ChainVerdict {
  const selected = chains.find((item) => item.chain_id === approval.chain_id && item.status === "geldig");
  if (!selected) throw new Error("E-APPROVAL-01");
  return selected;
}

export function gpMessage(c: Case, chains: ChainVerdict[], approval: Approved): string {
  const link = selectedChain(approval, chains).chain[0];
  return [
    "Geachte collega,",
    `Bij tekortcasus ${c.case_id} is na controle door apotheker ${approval.by} een product met dezelfde werkzame stof geselecteerd: ${link.product}, ${link.package}.`,
    `Het voorstel betreft ${c.substance} (${c.atc}). De toedieningsvorm is ${link.form}. De vergoeding is gecontroleerd tegen de vermelde synthetische preferentiemomentopname; dit is geen garantie.`,
    "De regelidentificaties, bronnen en eventuele weigeringen zijn in het auditspoor vastgelegd. Er is niets automatisch verzonden of afgeleverd.",
    "Met vriendelijke groet,\nDe apotheker",
  ].join("\n\n");
}

export function patientText(chains: ChainVerdict[], approval: Approved): string {
  selectedChain(approval, chains);
  return "Uw apotheek heeft een ander product met dezelfde werkzame stof gekozen. Het voorgeschreven product was niet leverbaar. De apotheker heeft de regels, de vergoeding en uw gegevens gecontroleerd. Het middel kan er anders uitzien of anders worden gebruikt. Vraag uw apotheker om uitleg als u dat wilt. Deze brief vervangt geen gesprek met uw apotheker.";
}

export function wordCount(value: string): number {
  return value.trim().split(/\s+/).length;
}

// English glosses of the Dutch letters. The Dutch originals remain the
// documents; these are reading aids for an English-speaking audience.

export function gpMessageEn(c: Case, chains: ChainVerdict[], approval: Approved): string {
  const link = selectedChain(approval, chains).chain[0];
  return [
    "Dear colleague,",
    `For shortage case ${c.case_id}, after review by pharmacist ${approval.by}, a product with the same active substance was selected: ${translateProduct(link.product, "en")}, ${translatePackage(link.package, "en")}.`,
    `The proposal concerns ${translateSubstance(c.substance, "en")} (${c.atc}). The form is ${translateForm(link.form, "en")}. Reimbursement was checked against the stated synthetic preference snapshot; this is no guarantee.`,
    "The rule identifiers, sources and any refusals are recorded in the audit trail. Nothing was sent or dispensed automatically.",
    "Kind regards,\nThe pharmacist",
  ].join("\n\n");
}

export function patientTextEn(chains: ChainVerdict[], approval: Approved): string {
  selectedChain(approval, chains);
  return "Your pharmacy has chosen a different product with the same active substance. The prescribed product was not available. The pharmacist checked the rules, the reimbursement and your details. The medicine may look different or be used differently. Ask your pharmacist if you would like an explanation. This letter does not replace a conversation with your pharmacist.";
}
