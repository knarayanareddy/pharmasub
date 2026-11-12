import type { Dimension } from "./archetypes";

export interface StoryEvent {
  id: string;
  label: string;
  short: string;
  label_en: string;
  short_en: string;
  effect: Partial<Record<Dimension, number>>;
}

export const EVENTS: StoryEvent[] = [
  { id: "tekortpiek", short: "Tekortpiek", short_en: "Shortage peak", label: "Een tekort aan een veelgebruikte bloedverdunner houdt zes weken aan", label_en: "A shortage of a widely used blood thinner lasts six weeks", effect: { refuse: .06, patient: -.08, unknown: .05 } },
  { id: "fout", short: "Afleverfout", short_en: "Dispensing error", label: "Een apotheek geeft de verkeerde sterkte af; het staat in het nieuws", label_en: "A pharmacy dispenses the wrong strength; it is in the news", effect: { refuse: .14, hops: .10, patient: -.10 } },
  { id: "petitie", short: "Petitie", short_en: "Petition", label: "De landelijke petitie over geneesmiddelentekorten haalt 200.000 handtekeningen", label_en: "The national petition on medicine shortages reaches 200,000 signatures", effect: { payer: .08, gp: .05, patient: .06 } },
  { id: "vergoeding", short: "Nieuw beleid", short_en: "New policy", label: "Een verzekeraar verandert per 1 januari het preferentiebeleid", label_en: "An insurer changes its preference policy on 1 January", effect: { payer: .06, unknown: .08, refuse: .03 } },
  { id: "importstop", short: "Importstop", short_en: "Import halt", label: "De IGJ beperkt de importroute voor twee stoffen", label_en: "The IGJ restricts the import route for two substances", effect: { hops: -.10, refuse: .05 } },
  { id: "ai_fout", short: "AI-fout", short_en: "AI error", label: "Een AI-systeem stelt een verkeerde substitutie voor; de inspectie grijpt in", label_en: "An AI system proposes a wrong substitution; the inspectorate intervenes", effect: { refuse: .16, patient: -.12, unknown: .08 } },
  { id: "werkdruk", short: "Werkdruk", short_en: "Workload", label: "Het personeelstekort in apotheken loopt op tot 3.000 fte", label_en: "The pharmacy staffing shortage rises to 3,000 FTE", effect: { payer: .10, hops: .08, gp: -.06 } },
  { id: "b1", short: "B1-uitleg", short_en: "B1 explanation", label: "Patiëntenfederaties eisen uitleg op B1-niveau", label_en: "Patient federations demand explanations at B1 level", effect: { patient: .10, gp: .04 } },
  { id: "besluit", short: "Verruimd besluit", short_en: "Wider decree", label: "Het tekortenbesluit wordt verruimd: meer ruimte voor buitenlandse producten", label_en: "The shortage decree is widened: more room for foreign products", effect: { hops: .12, refuse: -.06, unknown: .04 } },
];
