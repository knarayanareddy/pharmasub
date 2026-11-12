import type { Lang } from "./dictionary";

const SUBSTANCE_EN: Record<string, string> = {
  salbutamol: "salbutamol",
  metformine: "metformin",
  atorvastatine: "atorvastatin",
  omeprazol: "omeprazole",
  amoxicilline: "amoxicillin",
  levothyroxine: "levothyroxine",
  sertraline: "sertraline",
  oxycodon: "oxycodone",
  furosemide: "furosemide",
  prednison: "prednisone",
  "insuline glargine": "insulin glargine",
  methylfenidaat: "methylphenidate",
  tamsulosine: "tamsulosin",
  escitalopram: "escitalopram",
  naproxen: "naproxen",
  "paracetamol (zetpil)": "paracetamol (suppository)",
  "amoxicilline/clavulaanzuur": "amoxicillin/clavulanic acid",
  hydrochloorthiazide: "hydrochlorothiazide",
  pantoprazol: "pantoprazole",
  azitromycine: "azithromycin",
  "onbekende stof": "unknown substance",
  "niet-geregistreerde stof": "unregistered substance",
};

const FORM_EN: Record<string, string> = {
  inhalatiepoeder: "inhalation powder",
  aerosol: "aerosol",
  drank: "oral solution",
  tablet: "tablet",
  "tablet met gereguleerde afgifte": "modified-release tablet",
  "maagsapresistente tablet": "gastro-resistant tablet",
  capsule: "capsule",
  "capsule met gereguleerde afgifte": "modified-release capsule",
  "maagsapresistente capsule": "gastro-resistant capsule",
  injectievloeistof: "solution for injection",
  zetpil: "suppository",
  onbekend: "unknown",
};

const PRODUCT_TITLE_REPLACEMENTS: [string, string][] = [
  ["Amoxicilline/clavulaanzuur ", "Amoxicillin/clavulanic acid "],
  ["Amoxicilline ", "Amoxicillin "],
  ["Atorvastatine ", "Atorvastatin "],
  ["Azitromycine ", "Azithromycin "],
  ["Hydrochloorthiazide ", "Hydrochlorothiazide "],
  ["Insuline glargine ", "Insulin glargine "],
  ["Metformine ", "Metformin "],
  ["Methylfenidaat ", "Methylphenidate "],
  ["Omeprazol ", "Omeprazole "],
  ["Oxycodon ", "Oxycodone "],
  ["Pantoprazol ", "Pantoprazole "],
  ["Prednison ", "Prednisone "],
  ["Tamsulosine ", "Tamsulosin "],
];

const FORM_PHRASES_EN: [string, string][] = [
  ["capsule met gereguleerde afgifte", "modified-release capsule"],
  ["tablet met gereguleerde afgifte", "modified-release tablet"],
  ["maagsapresistente capsule", "gastro-resistant capsule"],
  ["maagsapresistente tablet", "gastro-resistant tablet"],
  ["inhalatiepoeder", "inhalation powder"],
  ["injectievloeistof", "solution for injection"],
  ["drank", "oral solution"],
  ["zetpil", "suppository"],
];

const PHARMACY_TYPE_EN: Record<string, string> = {
  zelfstandig: "independent",
  keten: "chain",
  ziekenhuis: "hospital",
  anders: "other",
};

const PATIENT_CONDITION_EN: Record<string, string> = {
  chronisch: "chronic condition",
  ouderen: "older adult",
  ouder_van_kind: "parent of a child",
  zwanger: "pregnant",
};

export function translateSubstance(value: string, lang: Lang): string {
  if (lang === "nl") return value;
  return SUBSTANCE_EN[value.toLowerCase()] ?? value;
}

export function translateForm(value: string, lang: Lang): string {
  if (lang === "nl") return value;
  return FORM_EN[value.toLowerCase()] ?? value;
}

export function translateStrength(value: string, lang: Lang): string {
  if (lang === "nl") return value;
  if (value === "onbekend") return "unknown";
  return value.replace(/(\d),(\d)/g, "$1.$2").replace(/E\/ml\b/g, "IU/ml");
}

export function translatePackage(value: string, lang: Lang): string {
  if (lang === "nl") return value;
  if (value === "onbekend") return "unknown";
  return value
    .replace(/\btabletten\b/g, "tablets")
    .replace(/\bzetpillen\b/g, "suppositories")
    .replace(/\bpennen\b/g, "pens");
}

export function translateProduct(value: string, lang: Lang): string {
  if (lang === "nl") return value;
  let out = value;
  for (const [nl, en] of PRODUCT_TITLE_REPLACEMENTS) {
    if (out.includes(nl)) out = out.replaceAll(nl, en);
  }
  out = translateStrength(out, "en");
  for (const [nl, en] of FORM_PHRASES_EN) {
    if (out.includes(nl)) out = out.replaceAll(nl, en);
  }
  return out;
}

export function translateInsurer(value: string, lang: Lang): string {
  if (lang === "nl") return value;
  return value === "onbekend" ? "unknown" : value;
}

export function translateSourceDoc(doc: string, lang: Lang): string {
  if (lang === "nl") return doc;
  let out = translateProduct(doc, "en");
  out = out
    .replace("Regeltabel Samenstelling · voorbeelddata", "Samenstelling rule table · example data")
    .replace("voorbeelddata — geen officiële lijst", "example data — not an official list")
    .replace("Preferentielijst ", "Preference list ")
    .replace("Preferentiebeleid ", "Preference policy ");
  return out;
}

export function translateNoticeText(text: string, lang: Lang): string {
  if (lang === "nl" || !text) return text;
  const lines = text.split("\n");
  return lines
    .map((line) => {
      const mHeader = line.match(/^SYNTHETISCHE MELDING (.+)$/);
      if (mHeader) return `SYNTHETIC NOTICE ${mHeader[1]}`;
      const mStof = line.match(/^Stof:\s*(.+)$/);
      if (mStof) return `Active substance: ${translateSubstance(mStof[1].trim(), "en")}`;
      const mPresc = line.match(/^Voorgeschreven:\s*(.+)$/);
      if (mPresc) {
        const raw = mPresc[1].trim();
        if (raw === "onbekend onbekend") return "Prescribed: unknown";
        return `Prescribed: ${translateProduct(raw, "en")}`;
      }
      if (line.startsWith("Melding: levering van het voorgeschreven product is tijdelijk niet mogelijk.")) {
        return "Notice: supply of the prescribed product is temporarily unavailable.";
      }
      if (line.startsWith("Vraag: beoordeel uitsluitend alternatieven met dezelfde werkzame stof.")) {
        return "Request: assess only alternatives with the same active substance.";
      }
      const mDate = line.match(/^Peildatum melding:\s*(.+)$/);
      if (mDate) return `Notice snapshot date: ${mDate[1]}`;
      return line;
    })
    .join("\n");
}

export function translatePharmacyType(value: string | null, lang: Lang): string {
  if (!value || lang === "nl") return value ?? "";
  return PHARMACY_TYPE_EN[value] ?? value;
}

export function translatePatientCondition(value: string | null, lang: Lang): string {
  if (!value || lang === "nl") return value ?? "";
  return PATIENT_CONDITION_EN[value] ?? value;
}

export function translateActor(value: string, lang: Lang): string {
  if (lang === "nl") return value;
  if (value === "synthetische-demo") return "synthetic-demo";
  if (value === "regel-engine") return "rule-engine";
  return value;
}

export function translateRoute(route: string, lang: Lang): string {
  if (lang === "nl") return route;
  if (route === "nl_geregistreerd") return "NL-registered";
  if (route === "import") return "import";
  if (route === "bereiding") return "compounding";
  return route;
}

export function translateAtc(atc: string, lang: Lang): string {
  if (lang === "nl") return atc;
  return atc === "ONBEKEND" ? "UNKNOWN" : atc;
}

const FORM_NL: Record<string, string> = Object.fromEntries(
  Object.entries(FORM_EN).map(([nl, en]) => [en.toLowerCase(), nl]),
);

const SUBSTANCE_NL: Record<string, string> = Object.fromEntries(
  Object.entries(SUBSTANCE_EN).map(([nl, en]) => [en.toLowerCase(), nl]),
);

export function canonicalSubstance(value: string): string {
  const key = value.trim().toLowerCase();
  return SUBSTANCE_NL[key] ?? value;
}

export function canonicalForm(value: string): string {
  const key = value.trim().toLowerCase();
  return FORM_NL[key] ?? value;
}

export function canonicalStrength(value: string): string {
  return value.replace(/\bIU\/ml\b/gi, "E/ml").replace(/\b0\.(\d)/g, "0,$1").replace(/\b(\d+)\.(\d+)/g, "$1,$2");
}

export function canonicalPackage(value: string): string {
  if (value.trim().toLowerCase() === "unknown") return "onbekend";
  return value
    .replace(/\btablets\b/gi, "tabletten")
    .replace(/\bsuppositories\b/gi, "zetpillen")
    .replace(/\bpens\b/gi, "pennen");
}

