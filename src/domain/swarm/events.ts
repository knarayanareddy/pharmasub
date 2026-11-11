import type { Dimension } from "./archetypes";

export interface StoryEvent {
  id: string;
  label: string;
  short: string;
  effect: Partial<Record<Dimension, number>>;
}

export const EVENTS: StoryEvent[] = [
  { id: "tekortpiek", short: "Tekortpiek", label: "Een tekort aan een veelgebruikte bloedverdunner houdt zes weken aan", effect: { refuse: .06, patient: -.08, unknown: .05 } },
  { id: "fout", short: "Afleverfout", label: "Een apotheek geeft de verkeerde sterkte af; het staat in het nieuws", effect: { refuse: .14, hops: .10, patient: -.10 } },
  { id: "petitie", short: "Petitie", label: "De landelijke petitie over geneesmiddelentekorten haalt 200.000 handtekeningen", effect: { payer: .08, gp: .05, patient: .06 } },
  { id: "vergoeding", short: "Nieuw beleid", label: "Een verzekeraar verandert per 1 januari het preferentiebeleid", effect: { payer: .06, unknown: .08, refuse: .03 } },
  { id: "importstop", short: "Importstop", label: "De IGJ beperkt de importroute voor twee stoffen", effect: { hops: -.10, refuse: .05 } },
  { id: "ai_fout", short: "AI-fout", label: "Een AI-systeem stelt een verkeerde substitutie voor; de inspectie grijpt in", effect: { refuse: .16, patient: -.12, unknown: .08 } },
  { id: "werkdruk", short: "Werkdruk", label: "Het personeelstekort in apotheken loopt op tot 3.000 fte", effect: { payer: .10, hops: .08, gp: -.06 } },
  { id: "b1", short: "B1-uitleg", label: "Patiëntenfederaties eisen uitleg op B1-niveau", effect: { patient: .10, gp: .04 } },
  { id: "besluit", short: "Verruimd besluit", label: "Het tekortenbesluit wordt verruimd: meer ruimte voor buitenlandse producten", effect: { hops: .12, refuse: -.06, unknown: .04 } },
];
