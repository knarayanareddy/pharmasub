import ensembleJson from "@data/swarm/runs.json";
import type { EnsembleResult } from "@/domain/swarm/ensemble";
import { runSwarm } from "@/domain/swarm/engine";
import { buildPersonas } from "@/domain/swarm/personas";
import SwarmLab from "./SwarmLab";
import "./swarm.css";

export const metadata = { title: "Simulatielab" };
export default function SwarmPage() {
  const personas = buildPersonas();
  const initialRun = runSwarm(personas, { seed: 20261111 });
  return <SwarmLab initialRun={initialRun} ensemble={ensembleJson as unknown as EnsembleResult} />;
}
