import { NextResponse } from "next/server";
import { EVENTS } from "@/domain/swarm/events";
import { runSwarm } from "@/domain/swarm/engine";
import { buildPersonas } from "@/domain/swarm/personas";

export async function POST(request: Request) {
  const body = await request.json() as { event_id?: string; seed?: number; pressure?: number; mixing?: number };
  if (!EVENTS.some((event) => event.id === body.event_id)) return NextResponse.json({ error: "E-EVENT-01" }, { status: 400 });
  const seed = body.seed || 20261111;
  const personas = buildPersonas(240, seed);
  return NextResponse.json(runSwarm(personas, { seed, inject: body.event_id, pressure: body.pressure, mixing: body.mixing }));
}
