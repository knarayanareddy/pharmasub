import { DIMENSIONS, PHARMACY_ARCHETYPES, type Dimension } from "./archetypes";
import { archetypeMeans, runSwarm, supportFor } from "./engine";
import type { Persona } from "./personas";

export interface Frequency {
  id: "QREFUSE" | "QHOPS" | "QPAYER" | "QGP" | "QUNKNOWN" | "QFOUT";
  question: string;
  x: number;
  n: number;
  p: number;
  lo: number;
  hi: number;
}

export function wilson(p: number, n: number, z = 1.959964) {
  if (n === 0) return { lo: 0, hi: 0 };
  const d = 1 + z * z / n, c = p + z * z / (2 * n), s = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return { lo: (c - s) / d, hi: (c + s) / d };
}

const questions = {
  QREFUSE: "Accepteert een meerderheid van apothekers weigeren boven gokken?",
  QHOPS: "Accepteert een meerderheid van apothekers de één-hopgrens?",
  QPAYER: "Zegt een meerderheid van de populatie dat de apotheek betaalt?",
  QGP: "Accepteert een meerderheid van huisartsen een bericht in plaats van een gesprek?",
  QUNKNOWN: "Tolereert een meerderheid van apothekers ‘onbekend’?",
  QFOUT: "Overleeft de één-hopmeerderheid het nieuws over een afleverfout?",
};

export function formatFrequency(frequency: Frequency): string {
  return `${frequency.x} / ${frequency.n} runs (p = ${frequency.p.toFixed(3)}, 95% CI ${frequency.lo.toFixed(3)}–${frequency.hi.toFixed(3)})`;
}

export function runEnsemble(personas: Persona[], runs = 200, seed = 20261111) {
  const values = Object.fromEntries(DIMENSIONS.map((dim) => [dim.id, [] as number[]])) as Record<Dimension, number[]>;
  const counts = { QREFUSE: 0, QHOPS: 0, QPAYER: 0, QGP: 0, QUNKNOWN: 0, QFOUT: 0 };
  const allKeys = Object.keys(personas[0].priors) as Dimension[];
  const divergenceValues: number[] = [];
  for (let runIndex = 0; runIndex < runs; runIndex++) {
    const runSeed = seed + runIndex * 7919;
    const run = runSwarm(personas, { seed: runSeed });
    for (const dim of DIMENSIONS) values[dim.id].push(run.snapshots.at(-1)!.means[dim.id]);
    if (supportFor(run, PHARMACY_ARCHETYPES, "refuse") > .5) counts.QREFUSE++;
    if (supportFor(run, PHARMACY_ARCHETYPES, "hops") > .5) counts.QHOPS++;
    if (supportFor(run, Object.keys(personas[0].priors).length ? [...new Set(personas.map((p) => p.archetype))] : [], "payer") > .5) counts.QPAYER++;
    if (supportFor(run, ["gp"], "gp") > .5) counts.QGP++;
    if (supportFor(run, PHARMACY_ARCHETYPES, "unknown") > .5) counts.QUNKNOWN++;
    const means = archetypeMeans(run);
    divergenceValues.push(Math.abs(means.wholesaler.hops - means.regulator.hops));
    const fired = runSwarm(personas, { seed: runSeed, inject: "fout" });
    if (supportFor(fired, PHARMACY_ARCHETYPES, "hops") > .5) counts.QFOUT++;
  }
  void allKeys;
  const frequencies = (Object.keys(counts) as (keyof typeof counts)[]).map((id) => {
    const p = counts[id] / runs;
    return { id, question: questions[id], x: counts[id], n: runs, p, ...wilson(p, runs) };
  });
  const distributions = Object.fromEntries(DIMENSIONS.map((dim) => {
    const sorted = [...values[dim.id]].sort((a, b) => a - b);
    const mean = sorted.reduce((sum, value) => sum + value, 0) / runs;
    const sd = Math.sqrt(sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / runs);
    const at = (p: number) => sorted[Math.min(runs - 1, Math.floor(p * runs))];
    const histogram = Array.from({ length: 20 }, (_, bucket) => ({ x: bucket * .05 + .025, n: sorted.filter((value) => value >= bucket * .05 && value < (bucket + 1) * .05).length }));
    return [dim.id, { mean, sd, p10: at(.1), p50: at(.5), p90: at(.9), histogram }];
  }));
  return {
    runs, seed, frequencies, distributions,
    divergence: divergenceValues.reduce((sum, value) => sum + value, 0) / runs,
    generated: "deterministisch uit vaste seeds",
  };
}

export type EnsembleResult = ReturnType<typeof runEnsemble>;
