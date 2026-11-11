import type { Case, ChainLink, PatientFlag } from "./types";

const flagText: Record<PatientFlag, string> = {
  renaal: "een nierfunctiestoornis",
  zwangerschap: "zwangerschap",
  pediatrisch: "een leeftijd onder 12 jaar",
  allergie_penicilline: "een penicilline-allergie",
  allergie_nsaid: "een NSAID-allergie",
  leverfunctie: "een leverfunctiestoornis",
};

export function refusalSentence(rule: string, c: Case, link?: ChainLink, flag?: PatientFlag): string {
  const product = link?.product || "Dit product";
  switch (rule) {
    case "P-SUB-01":
      return "Een ander werkzaam bestanddeel is geen substitutie maar een therapiewijziging. Dat beslist de apotheker samen met de voorschrijver.";
    case "P-STR-01":
      return `${product} heeft volgens de bron een ander dosisinterval dan ${c.strength} ${c.form} — niet uitwisselbaar zonder controle.`;
    case "P-STR-02":
      return "Deze keten bevat twee opeenvolgende wijzigingen. Twee wijzigingen vragen een expliciete beoordeling door de apotheker.";
    case "P-CI-01":
      return `Deze synthetische casus heeft ${flag ? flagText[flag] : "een patiëntkenmerk"}; de SmPC van ${product} vermeldt een onopgeloste contra-indicatie. Niet automatisch uitwisselbaar.`;
    case "P-REIMB-01":
      return c.insurer === "onbekend"
        ? "De verzekeraar is niet bekend. Daardoor is de vergoeding onbekend; onbekend is geen ‘vergoed’. De apotheker moet dit controleren."
        : `De vergoeding van ${product} is niet vast te stellen in de momentopname van ${c.insurer}. Onbekend is geen ‘vergoed’. Controleer de actuele lijst.`;
    case "P-IMPORT-01":
      return `Voor de import van ${product} ontbreekt een citeerbare buitenlandse registratie. Zonder die registratie is er geen importroute.`;
    case "P-PAEDI-01":
      return `${product} is in dit synthetische extract alleen voor volwassenen gemarkeerd; de casus is pediatrisch. Daarom is deze keten afgewezen.`;
    case "P-UNKNOWN-01":
      return "Deze stof staat niet in onze regeltabel. Wij gokken niet — de apotheker beslist.";
    case "P-SOURCE-01":
      return `${product} mist een bron of peildatum voor een noodzakelijk veld. Het voorstel blijft daarom onbekend en wordt niet als bruikbaar gepresenteerd.`;
    default:
      return "De apotheker moet deze keten beoordelen; de regeltabel geeft geen voldoende onderbouwde uitkomst.";
  }
}

export function notReimbursedSentence(product: string, insurer: string): string {
  return `${product} staat in de synthetische momentopname van ${insurer} als niet vergoed. De apotheker moet een vergoed alternatief beoordelen of het beleid controleren.`;
}

// English glosses. The Dutch sentences above remain the authoritative
// clinical documents; these exist so an English-speaking reader can follow
// the reasoning. They are never used for decisions, only for display.

const flagTextEn: Record<PatientFlag, string> = {
  renaal: "a kidney-function disorder",
  zwangerschap: "pregnancy",
  pediatrisch: "an age under 12",
  allergie_penicilline: "a penicillin allergy",
  allergie_nsaid: "an NSAID allergy",
  leverfunctie: "a liver-function disorder",
};

export function refusalSentenceEn(rule: string, c: Case, link?: ChainLink, flag?: PatientFlag): string {
  const product = link?.product || "This product";
  switch (rule) {
    case "P-SUB-01":
      return "A different active substance is not a substitution but a change of therapy. The pharmacist decides this together with the prescriber.";
    case "P-STR-01":
      return `${product} has a different dose interval than ${c.strength} ${c.form} according to the source — not interchangeable without a check.`;
    case "P-STR-02":
      return "This chain contains two consecutive changes. Two changes require an explicit assessment by the pharmacist.";
    case "P-CI-01":
      return `This synthetic case has ${flag ? flagTextEn[flag] : "a patient flag"}; the SmPC for ${product} lists an unresolved contraindication. Not automatically interchangeable.`;
    case "P-REIMB-01":
      return c.insurer === "onbekend"
        ? "The insurer is unknown. Reimbursement is therefore unknown; unknown is not ‘reimbursed’. The pharmacist must check this."
        : `Reimbursement for ${product} cannot be established in the ${c.insurer} snapshot. Unknown is not ‘reimbursed’. Check the current list.`;
    case "P-IMPORT-01":
      return `For the import of ${product} there is no citable foreign registration. Without that registration there is no import route.`;
    case "P-PAEDI-01":
      return `${product} is marked for adults only in this synthetic extract; the case is paediatric. This chain is therefore rejected.`;
    case "P-UNKNOWN-01":
      return "This substance is not in our rule table. We do not guess — the pharmacist decides.";
    case "P-SOURCE-01":
      return `${product} is missing a source or date for a required field. The proposal therefore stays unknown and is not presented as usable.`;
    default:
      return "The pharmacist must assess this chain; the rule table gives no sufficiently substantiated outcome.";
  }
}

export function notReimbursedSentenceEn(product: string, insurer: string): string {
  return `${product} is listed as not reimbursed in the synthetic ${insurer} snapshot. The pharmacist must assess a reimbursed alternative or check the policy.`;
}

export const EQUIVALENCE_NOTE_EN_GENERIC =
  "Same dose interval per the synthetic SmPC extract — the pharmacist checks strength and form.";
