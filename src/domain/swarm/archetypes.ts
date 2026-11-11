export const DIMENSIONS = [
  { id: "refuse", label: "Weigeren is een functie", left: "beter een gok dan niets", right: "liever weigeren dan gokken", blurb: "Een zichtbare weigering is beter dan een ogenschijnlijk zekere gok." },
  { id: "hops", label: "Maximaal één wijziging", left: "zoveel mogelijk ketens", right: "maximaal één hop", blurb: "Dekking versus veiligheid, als één aantastbare aanname." },
  { id: "payer", label: "De apotheek betaalt", left: "verzekeraar of groothandel betaalt", right: "de apotheek betaalt", blurb: "Wie het legale en financiële redeneerwerk financiert." },
  { id: "gp", label: "Een bericht is genoeg", left: "de huisarts wil bellen", right: "een bericht is genoeg", blurb: "De workflowbelofte tussen apotheker en voorschrijver." },
  { id: "unknown", label: "Onbekend mag", left: "onbekend is onacceptabel", right: "onbekend is een eerlijk antwoord", blurb: "Of professionals een eerlijk niet-weten accepteren." },
  { id: "patient", label: "Uitleg op B1 volstaat", left: "de patiënt wil hetzelfde product", right: "uitleg op B1 is genoeg", blurb: "De laatste stap van iedere substitutie." },
] as const;

export type Dimension = typeof DIMENSIONS[number]["id"];
export type ArchetypeKey = keyof typeof ARCH;

export const ARCH = {
  pharm_ind: { label: "Openbare apothekers", n: 46, priors: { refuse: .70, hops: .58, payer: .60, gp: .52, unknown: .62, patient: .56 }, behav: { voice: .74, susceptibility: .50, conviction: .55 } },
  pharm_tech: { label: "Apothekersassistenten", n: 34, priors: { refuse: .58, hops: .52, payer: .46, gp: .56, unknown: .55, patient: .58 }, behav: { voice: .52, susceptibility: .64, conviction: .45 } },
  pharm_chain: { label: "Apothekers in ketens", n: 26, priors: { refuse: .64, hops: .70, payer: .54, gp: .50, unknown: .58, patient: .52 }, behav: { voice: .60, susceptibility: .44, conviction: .60 } },
  pharm_hosp: { label: "Ziekenhuisapothekers", n: 18, priors: { refuse: .78, hops: .74, payer: .52, gp: .48, unknown: .70, patient: .50 }, behav: { voice: .66, susceptibility: .40, conviction: .66 } },
  gp: { label: "Huisartsen", n: 30, priors: { refuse: .52, hops: .44, payer: .38, gp: .40, unknown: .46, patient: .52 }, behav: { voice: .62, susceptibility: .44, conviction: .62 } },
  patient: { label: "Patiënten", n: 34, priors: { refuse: .44, hops: .36, payer: .30, gp: .44, unknown: .30, patient: .66 }, behav: { voice: .46, susceptibility: .70, conviction: .48 } },
  insurer: { label: "Zorgverzekeraars", n: 16, priors: { refuse: .56, hops: .62, payer: .82, gp: .46, unknown: .52, patient: .48 }, behav: { voice: .58, susceptibility: .30, conviction: .74 } },
  wholesaler: { label: "Groothandel / importeur", n: 18, priors: { refuse: .34, hops: .88, payer: .22, gp: .46, unknown: .34, patient: .46 }, behav: { voice: .64, susceptibility: .34, conviction: .70 } },
  regulator: { label: "IGJ / inspectie", n: 10, priors: { refuse: .90, hops: .66, payer: .40, gp: .52, unknown: .78, patient: .54 }, behav: { voice: .70, susceptibility: .22, conviction: .84 } },
  import: { label: "Import- en bereidingsapotheken", n: 8, priors: { refuse: .48, hops: .92, payer: .44, gp: .50, unknown: .50, patient: .50 }, behav: { voice: .56, susceptibility: .36, conviction: .64 } },
} as const;

export const PHARMACY_ARCHETYPES: ArchetypeKey[] = ["pharm_ind", "pharm_tech", "pharm_chain", "pharm_hosp"];
