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
