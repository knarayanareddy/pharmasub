import { NextResponse } from "next/server";
import { ARCH, DIMENSIONS } from "@/domain/swarm/archetypes";
import { runEnsemble } from "@/domain/swarm/ensemble";
import { EVENTS } from "@/domain/swarm/events";
import { runSwarm } from "@/domain/swarm/engine";
import { buildPersonas } from "@/domain/swarm/personas";

export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const url = new URL(request.url);
  const runs = Math.min(500, Math.max(1, Number(url.searchParams.get("runs")) || 200));
  const seed = Number(url.searchParams.get("seed")) || 20261111;
  const personas = buildPersonas(240, seed);
  return NextResponse.json({ ensemble: runEnsemble(personas, runs, seed), run: runSwarm(personas, { seed }), archetypes: ARCH, dims: DIMENSIONS, events: EVENTS, honesty: ["GEEN LLM", "SYNTHETISCH", "GEEN VOORSPELLING", "PRIOREN ZIJN AANNAMES"] });
}
