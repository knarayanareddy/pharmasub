import type { Metadata } from "next";
import ensembleJson from "@data/swarm/runs.json";
import type { EnsembleResult } from "@/domain/swarm/ensemble";
import { runSwarm } from "@/domain/swarm/engine";
import { buildPersonas } from "@/domain/swarm/personas";
import { getDictionary } from "@/i18n/dictionary";
import { getLang } from "@/i18n/server";
import SwarmLab from "./SwarmLab";
import "./swarm.css";

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang();
  return { title: getDictionary(lang).meta_swarm };
}

export default function SwarmPage() {
  const personas = buildPersonas();
  const initialRun = runSwarm(personas, { seed: 20261111 });
  return <SwarmLab initialRun={initialRun} ensemble={ensembleJson as unknown as EnsembleResult} />;
}
