import { ARCH, DIMENSIONS, type ArchetypeKey, type Dimension } from "./archetypes";
import { clamp, mulberry32 } from "./rng";

export interface Persona {
  id: string;
  name: string;
  archetype: ArchetypeKey;
  synthetic: true;
  years_experience: number | null;
  pharmacy_type: "zelfstandig" | "keten" | "ziekenhuis" | "anders" | null;
  region: string;
  patient_condition: "chronisch" | "ouderen" | "ouder_van_kind" | "zwanger" | null;
  priors: Record<Dimension, number>;
  behav: { voice: number; susceptibility: number; conviction: number };
}

const surnames = ["de Jong", "Jansen", "de Vries", "van den Berg", "van Dijk", "Bakker", "Visser", "Smit", "Meijer", "de Boer", "Mulder", "de Groot", "Bos", "Vos", "Peters", "Hendriks", "van Leeuwen", "Dekker", "Brouwer", "de Wit", "Dijkstra", "Smits", "van der Meer", "Kok", "Jacobs", "de Haan", "Vermeulen", "van der Linden", "Maas", "van den Heuvel", "Yılmaz", "Demir", "Kaya", "Çelik", "Şahin", "El Idrissi", "Benali", "El Amrani", "Bouzidi", "Ait Ali", "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Haddad", "Khoury", "Nasser", "Al-Ahmad", "Al-Hassan", "Nguyen", "Tran", "Singh", "Kaur", "van Dam", "van der Wal", "Willems", "Hermans", "van der Velden", "Schouten", "van Beek", "van Vliet", "van Wijk", "de Bruin", "van der Laan", "Hoekstra", "Koster", "Prins", "Blom", "Timmermans", "van den Bosch"];
const given = ["Sam", "Noor", "Robin", "Mila", "Daan", "Sanne", "Mo", "Eva", "Joris", "Fatima", "Kees", "Anouk", "Kuba", "Lina", "Thijs", "Meryem"];
const regions = ["Noord-Holland", "Zuid-Holland", "Utrecht", "Gelderland", "Noord-Brabant", "Limburg", "Overijssel", "Groningen", "Friesland", "Zeeland", "Drenthe", "Flevoland"];

export function buildPersonas(_n = 240, seed = 20261111): Persona[] {
  const rnd = mulberry32(seed);
  const personas: Persona[] = [];
  for (const [key, archetype] of Object.entries(ARCH) as [ArchetypeKey, typeof ARCH[ArchetypeKey]][]) {
    for (let index = 0; index < archetype.n; index++) {
      const priors = Object.fromEntries(DIMENSIONS.map((dim) => [dim.id, clamp(archetype.priors[dim.id] + (rnd() - .5) * .08)])) as Record<Dimension, number>;
      const staff = key !== "patient";
      personas.push({
        id: `P-${String(personas.length + 1).padStart(3, "0")}`,
        name: `${given[Math.floor(rnd() * given.length)]} ${surnames[Math.floor(rnd() * surnames.length)]}`,
        archetype: key, synthetic: true,
        years_experience: staff ? Math.floor(rnd() * 36) : null,
        pharmacy_type: staff ? key === "pharm_chain" ? "keten" : key === "pharm_hosp" ? "ziekenhuis" : key === "pharm_ind" ? "zelfstandig" : "anders" : null,
        region: regions[Math.floor(rnd() * regions.length)],
        patient_condition: key === "patient" ? (["chronisch", "ouderen", "ouder_van_kind", "zwanger"] as const)[Math.floor(rnd() * 4)] : null,
        priors,
        behav: {
          voice: clamp(archetype.behav.voice + (rnd() - .5) * .1),
          susceptibility: clamp(archetype.behav.susceptibility + (rnd() - .5) * .1),
          conviction: clamp(archetype.behav.conviction + (rnd() - .5) * .1),
        },
      });
    }
  }
  return personas;
}
