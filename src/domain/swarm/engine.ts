import { ARCH, DIMENSIONS, type ArchetypeKey, type Dimension } from "./archetypes";
import { EVENTS, type StoryEvent } from "./events";
import type { Persona } from "./personas";
import { clamp, fisherYates, mulberry32 } from "./rng";

export type Opinions = Record<Dimension, number>;
export interface SwarmEdge { source: number; target: number; local: boolean }
export interface RoundSnapshot {
  round: number;
  opinions: Opinions[];
  means: Record<Dimension, number>;
  camps: Record<Dimension, { left: number; swing: number; right: number }>;
  support: Record<Dimension, number>;
  event: string | null;
  event_en: string | null;
}
export interface SwarmRun {
  seed: number;
  rounds: number;
  personas: Persona[];
  edges: SwarmEdge[];
  snapshots: RoundSnapshot[];
  initial: Opinions[];
  final: Opinions[];
  changed: boolean[];
  fired: { round: number; event: StoryEvent }[];
  lastNeighbour: number[];
}

export interface SwarmOptions {
  rounds?: number;
  mixing?: number;
  pressure?: number;
  seed: number;
  minEvents?: number;
  inject?: string;
}

function buildGraph(personas: Persona[], mixing: number, rnd: () => number): { edges: SwarmEdge[]; neighbours: Set<number>[] } {
  const neighbours = personas.map(() => new Set<number>());
  const edges: SwarmEdge[] = [];
  const local = Math.round(7 * (1 - mixing));
  const connect = (source: number, target: number, isLocal: boolean) => {
    if (source === target || neighbours[source].has(target)) return false;
    neighbours[source].add(target);
    neighbours[target].add(source);
    edges.push({ source, target, local: isLocal });
    return true;
  };
  for (let index = 0; index < personas.length; index++) {
    const same = personas.map((p, other) => ({ p, other })).filter(({ p, other }) => other !== index && p.archetype === personas[index].archetype).map(({ other }) => other);
    const shuffled = fisherYates(same, rnd);
    let cursor = 0;
    while (neighbours[index].size < local && cursor < shuffled.length) connect(index, shuffled[cursor++], true);
    let guard = 0;
    while (neighbours[index].size < 7 && guard++ < 100) {
      const target = Math.floor(rnd() * personas.length);
      if (mixing === 0 && personas[target].archetype !== personas[index].archetype) continue;
      connect(index, target, personas[target].archetype === personas[index].archetype);
    }
  }
  return { edges, neighbours };
}

function snapshot(round: number, opinions: Opinions[], event: string | null, event_en: string | null): RoundSnapshot {
  const means = {} as Record<Dimension, number>;
  const camps = {} as RoundSnapshot["camps"];
  const support = {} as Record<Dimension, number>;
  for (const dim of DIMENSIONS) {
    const values = opinions.map((opinion) => opinion[dim.id]);
    means[dim.id] = values.reduce((sum, value) => sum + value, 0) / values.length;
    const left = values.filter((value) => value < .42).length;
    const right = values.filter((value) => value > .58).length;
    camps[dim.id] = { left, swing: values.length - left - right, right };
    support[dim.id] = right / values.length;
  }
  return { round, opinions: opinions.map((opinion) => ({ ...opinion })), means, camps, support, event, event_en };
}

export function runSwarm(personas: Persona[], options: SwarmOptions): SwarmRun {
  const { rounds = 24, mixing = .18, pressure = 1, seed, inject } = options;
  const rnd = mulberry32(seed);
  const eligible = Array.from({ length: rounds - 4 }, (_, index) => index + 3);
  const plannedRounds = fisherYates(eligible, rnd).slice(0, 3).sort((a, b) => a - b);
  const plannedEvents = fisherYates(EVENTS, rnd).slice(0, 3);
  if (inject) {
    const story = EVENTS.find((event) => event.id === inject);
    if (!story) throw new Error("Onbekende gebeurtenis");
    const existing = plannedEvents.findIndex((event) => event.id === inject);
    if (existing >= 0) plannedEvents.splice(existing, 1);
    plannedEvents.unshift(story);
    plannedEvents.length = 3;
  }
  const { edges, neighbours } = buildGraph(personas, mixing, rnd);
  const initial = personas.map((persona) => Object.fromEntries(DIMENSIONS.map((dim) => [dim.id, clamp(persona.priors[dim.id] + (rnd() - .5) * .18)])) as Opinions);
  const opinions = initial.map((opinion) => ({ ...opinion }));
  const lastNeighbour = personas.map((_, index) => neighbours[index].values().next().value ?? index);
  const snapshots = [snapshot(0, opinions, null, null)];
  const fired: { round: number; event: StoryEvent }[] = [];

  for (let round = 1; round <= rounds; round++) {
    const order = fisherYates(personas.map((_, index) => index), rnd);
    for (const index of order) {
      const available = [...neighbours[index]];
      if (!available.length) continue;
      const neighbour = available[Math.floor(rnd() * available.length)];
      lastNeighbour[index] = neighbour;
      for (const dim of DIMENSIONS) {
        const gap = opinions[neighbour][dim.id] - opinions[index][dim.id];
        const likeness = 1 - Math.min(1, Math.abs(gap) * 1.4);
        const influence = (.35 + .65 * personas[neighbour].behav.voice) * (.4 + .6 * likeness);
        const openness = personas[index].behav.susceptibility * (1 - .75 * personas[index].behav.conviction);
        let move = gap * influence * openness * .42 * pressure;
        if (Math.abs(gap) > .45 && personas[index].behav.conviction > .6 && rnd() < .5) {
          move = -Math.sign(gap) * Math.abs(gap) * .10 * pressure;
        }
        opinions[index][dim.id] = clamp(opinions[index][dim.id] + move);
      }
    }
    const eventIndex = plannedRounds.indexOf(round);
    const story = eventIndex >= 0 ? plannedEvents[eventIndex] : undefined;
    if (story) {
      for (const opinion of opinions) {
        for (const dim of DIMENSIONS) {
          const effect = story.effect[dim.id] || 0;
          opinion[dim.id] = clamp(opinion[dim.id] + effect * (.6 + .8 * rnd()));
        }
      }
      fired.push({ round, event: story });
    }
    snapshots.push(snapshot(round, opinions, story?.label || null, story?.label_en || null));
  }
  return {
    seed, rounds, personas, edges, snapshots, initial, final: opinions.map((opinion) => ({ ...opinion })),
    changed: opinions.map((opinion, index) => DIMENSIONS.some((dim) => Math.abs(opinion[dim.id] - initial[index][dim.id]) > .05)),
    fired, lastNeighbour,
  };
}

export function supportFor(run: SwarmRun, archetypes: ArchetypeKey[], dim: Dimension): number {
  const indices = run.personas.map((persona, index) => ({ persona, index })).filter(({ persona }) => archetypes.includes(persona.archetype));
  return indices.filter(({ index }) => run.final[index][dim] > .58).length / indices.length;
}

export function archetypeMeans(run: SwarmRun): Record<ArchetypeKey, Opinions> {
  return Object.fromEntries(Object.keys(ARCH).map((key) => {
    const archetype = key as ArchetypeKey;
    const indices = run.personas.map((persona, index) => ({ persona, index })).filter(({ persona }) => persona.archetype === archetype);
    return [archetype, Object.fromEntries(DIMENSIONS.map((dim) => [dim.id, indices.reduce((sum, { index }) => sum + run.final[index][dim.id], 0) / indices.length]))];
  })) as Record<ArchetypeKey, Opinions>;
}
