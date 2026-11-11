import { writeFileSync } from "node:fs";
import { buildPersonas } from "../src/domain/swarm/personas";
import { runEnsemble } from "../src/domain/swarm/ensemble";

const personas = buildPersonas();
const result = runEnsemble(personas, 200);
writeFileSync("data/swarm/personas.json", JSON.stringify(personas, null, 2) + "\n");
writeFileSync("data/swarm/runs.json", JSON.stringify(result, null, 2) + "\n");
console.log(`${personas.length} synthetische persona's · ${result.runs} runs`);
for (const frequency of result.frequencies) console.log(`${frequency.id}: ${frequency.x}/${frequency.n} (${frequency.lo.toFixed(3)}–${frequency.hi.toFixed(3)})`);
