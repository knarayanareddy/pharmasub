"use client";

import { Activity, ArrowRight, CirclePause, CirclePlay, Gauge, Info, MousePointer2, RotateCcw, SkipForward, UsersRound, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ARCH, DIMENSIONS, type Dimension } from "@/domain/swarm/archetypes";
import type { EnsembleResult } from "@/domain/swarm/ensemble";
import { runSwarm, type SwarmRun } from "@/domain/swarm/engine";
import { EVENTS } from "@/domain/swarm/events";
import SwarmCanvas from "./SwarmCanvas";
import Report from "./Report";

const colours: Record<Dimension, string> = { refuse: "#36a474", hops: "#78a9cf", payer: "#c2a557", gp: "#a68bc1", unknown: "#d29b55", patient: "#7eb5a5" };

export default function SwarmLab({ initialRun, ensemble }: { initialRun: SwarmRun; ensemble: EnsembleResult }) {
  const [run, setRun] = useState(initialRun);
  const [round, setRound] = useState(24);
  const [dimension, setDimension] = useState<Dimension>("hops");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [pressure, setPressure] = useState(1);
  const [mixing, setMixing] = useState(.18);
  const [injection, setInjection] = useState<string | undefined>();
  const [decisionLine, setDecisionLine] = useState(.5);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [fps, setFps] = useState(0);
  const [tab, setTab] = useState<"simulatie" | "rapport">("simulatie");
  const [ghost, setGhost] = useState<{ left: number; swing: number; right: number } | null>(null);
  const snapshot = run.snapshots[round];
  const dim = DIMENSIONS.find((item) => item.id === dimension)!;
  const countRight = snapshot.opinions.filter((opinion) => opinion[dimension] > decisionLine).length;
  const onFps = useCallback((value: number) => setFps(value), []);
  const onSelect = useCallback((index: number) => setSelectedAgent(index), []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setRound((current) => {
      if (current >= run.rounds) { setPlaying(false); return current; }
      return current + 1;
    }), 700 / speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, run.rounds]);

  function recalculate(next: { pressure?: number; mixing?: number; inject?: string }) {
    setGhost(run.snapshots.at(-1)!.camps[dimension]);
    const nextPressure = next.pressure ?? pressure, nextMixing = next.mixing ?? mixing;
    setRun(runSwarm(run.personas, { seed: run.seed, pressure: nextPressure, mixing: nextMixing, inject: next.inject }));
    setRound(24); setPlaying(false); setSelectedAgent(null);
  }
  function fire(eventId: string) { setInjection(eventId); recalculate({ inject: eventId }); }
  function reset() {
    setRun(runSwarm(run.personas, { seed: 20261111 })); setRound(0); setPlaying(false); setPressure(1); setMixing(.18); setInjection(undefined); setGhost(null); setSelectedAgent(null);
  }
  const agent = selectedAgent === null ? null : run.personas[selectedAgent];
  const neighbour = selectedAgent === null ? null : run.personas[run.lastNeighbour[selectedAgent]];
  const sparkPaths = useMemo(() => DIMENSIONS.map((item) => {
    const points = run.snapshots.map((itemSnapshot, index) => `${index / run.rounds * 600},${80 - itemSnapshot.means[item.id] * 70}`).join(" ");
    return { id: item.id, points };
  }), [run]);

  return <div className="page swarm-page">
    <div className="swarm-heading"><div><div className="eyebrow">MiroFish · dynamisch systeem</div><h1 className="page-title">Waar breekt dit ontwerp?</h1><p className="page-intro">Geen taalmodel. Wel 240 synthetische agenten, zes aantastbare aannames en een netwerk dat u live kunt veranderen.</p></div><div className="swarm-heading-stats"><div><UsersRound size={16} /><strong>240</strong><span>agenten</span></div><div><Activity size={16} /><strong>200</strong><span>runs</span></div><div><Gauge size={16} /><strong>{fps || "—"}</strong><span>fps live</span></div></div></div>
    <div className="honesty-strip swarm-honesty"><span>GEEN LLM</span><span>SYNTHETISCH</span><span>GEEN VOORSPELLING</span><span>PRIOREN ZIJN AANNAMES</span><p>Frequenties uit een modelpopulatie — geen uitspraak over echte mensen.</p></div>
    <div className="swarm-tabs" role="tablist"><button role="tab" aria-selected={tab === "simulatie"} className={tab === "simulatie" ? "active" : ""} onClick={() => setTab("simulatie")}><MousePointer2 size={15} />Interactieve simulatie</button><button role="tab" aria-selected={tab === "rapport"} className={tab === "rapport" ? "active" : ""} onClick={() => setTab("rapport")}><Activity size={15} />Rapport, CIs & falsifiers<ArrowRight size={14} /></button></div>
    {tab === "rapport" ? <Report ensemble={ensemble} /> : <>
      <div className="dimension-tabs">{DIMENSIONS.map((item) => <button key={item.id} className={dimension === item.id ? "active" : ""} onClick={() => { setDimension(item.id); setGhost(null); }}><span className="mono">{item.id}</span><strong>{item.label}</strong></button>)}</div>
      <div className="swarm-workspace">
        <section className="canvas-panel">
          <div className="canvas-legend"><span><i className="positive" />POS</span><span><i className="neutral" />NEU</span><span><i className="negative" />NEG</span><span className="canvas-hint">Klik op een agent voor het verhaal erachter</span></div>
          <SwarmCanvas run={run} round={round} dimension={dimension} decisionLine={decisionLine} ghost={ghost} onSelect={onSelect} onFps={onFps} />
          {snapshot.event && <div className="canvas-event"><Zap size={14} /><span>{snapshot.event}</span></div>}
          <div className="playback-bar"><div className="playback-buttons"><button className="canvas-button primary" onClick={() => { if (round === 24) setRound(0); setPlaying(!playing); }}>{playing ? <CirclePause size={17} /> : <CirclePlay size={17} />}{playing ? "Pauze" : "Start"}</button><button className="canvas-button" onClick={() => { setPlaying(false); setRound(Math.min(24, round + 1)); }}><SkipForward size={16} />Stap</button><button className="canvas-button" onClick={reset}><RotateCcw size={15} />Reset</button></div><div className="speed-control">{[1, 2, 4].map((value) => <button key={value} className={speed === value ? "active" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}</div><span className="round-counter mono">{String(round).padStart(2, "0")} / 24</span></div>
          <div className="timeline"><input aria-label="Scrub door rondes" type="range" min="0" max="24" value={round} onChange={(event) => { setPlaying(false); setRound(Number(event.target.value)); }} /><div className="timeline-ticks"><span>0 · priors</span><span>12</span><span>24 · eindstand</span></div><svg viewBox="0 0 600 90" preserveAspectRatio="none" aria-label="Gemiddelden per ronde">{[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2="600" y1={line * 23 + 5} y2={line * 23 + 5} stroke="#e3e8eb" strokeWidth="1" />)}{sparkPaths.map((path) => <polyline key={path.id} points={path.points} fill="none" stroke={colours[path.id]} strokeWidth={path.id === dimension ? 2.5 : 1} opacity={path.id === dimension ? 1 : .42} />)}{run.fired.map((fired) => <line key={fired.round} x1={fired.round / 24 * 600} x2={fired.round / 24 * 600} y1="3" y2="85" stroke="#a3221c" strokeDasharray="3 3" />)}<line x1={round / 24 * 600} x2={round / 24 * 600} y1="0" y2="90" stroke="#14202b" strokeWidth="1.5" /></svg><div className="sparkline-labels">{DIMENSIONS.map((item) => <span key={item.id}><i style={{ background: colours[item.id] }} />{item.id}</span>)}</div></div>
        </section>
        <aside className="swarm-controls">
          <section className="control-section decision-control"><div className="control-title"><span>Beslissingslijn</span><strong className="mono">{decisionLine.toFixed(2)}</strong></div><h3>{dim.label}</h3><p>{dim.blurb}</p><div className="pole-labels"><span>{dim.left}</span><span>{dim.right}</span></div><div className="decision-track"><div className="decision-mid" style={{ left: `${decisionLine * 100}%` }} /><input aria-label="Sleep de beslissingslijn" type="range" min="0.05" max="0.95" step="0.01" value={decisionLine} onChange={(event) => setDecisionLine(Number(event.target.value))} /></div><div className="recount"><strong className="mono">{countRight}</strong><span>van 240 aan de rechterkant</span></div><small>Met de lijn hier · ronde {round} · tellen bij &gt; {decisionLine.toFixed(2)}</small></section>
          <section className="control-section"><div className="control-title"><span>Twee hendels</span><Info size={13} /></div><label className="lever"><span><strong>Druk</strong><output className="mono">{pressure.toFixed(1)}×</output></span><input type="range" min="0.4" max="2" step="0.1" value={pressure} onChange={(event) => { const value = Number(event.target.value); setPressure(value); recalculate({ pressure: value }); }} /><small>Hoe sterk meningen en verhalen bewegen</small></label><label className="lever"><span><strong>Vermenging</strong><output className="mono">{Math.round(mixing * 100)}%</output></span><input type="range" min="0" max="1" step="0.02" value={mixing} onChange={(event) => { const value = Number(event.target.value); setMixing(value); recalculate({ mixing: value }); }} /><small>{mixing === 0 ? "Tien niet-communicerende beroepsclusters" : `${Math.round(7 * (1 - mixing))} van 7 verbindingen lokaal`}</small></label></section>
          <section className="control-section story-control"><div className="control-title"><span>Vuur je eigen verhaal af</span><Zap size={13} /></div><p>De hele run wordt opnieuw berekend. De stippellijn bewaart de vorige eindstand.</p><div className="event-chips">{EVENTS.map((event) => <button key={event.id} className={injection === event.id ? "active" : ""} title={event.label} onClick={() => fire(event.id)}>{event.short}</button>)}</div>{injection && <div className="injected-story"><strong>{EVENTS.find((event) => event.id === injection)?.label}</strong><button onClick={() => { setInjection(undefined); recalculate({ inject: undefined }); }}>basisrun herstellen</button></div>}</section>
          {agent && selectedAgent !== null && <section className="agent-profile"><div className="agent-profile-top"><span className="agent-avatar">{agent.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div><h3>{agent.name}</h3><span className="mono">{agent.id} · SYNTHETISCH</span></div><button onClick={() => setSelectedAgent(null)} aria-label="Sluit profiel">×</button></div><div className="agent-facts"><span>{ARCH[agent.archetype].label}</span><span>{agent.region}</span><span>{agent.years_experience === null ? agent.patient_condition : `${agent.years_experience} jaar ervaring · ${agent.pharmacy_type}`}</span></div><div className="agent-opinions">{DIMENSIONS.map((item) => { const before = run.initial[selectedAgent][item.id], after = snapshot.opinions[selectedAgent][item.id]; return <div key={item.id}><span>{item.id}</span><div><i style={{ width: `${after * 100}%` }} /></div><strong className="mono">{after.toFixed(2)}</strong><small className={after >= before ? "moved-up" : "moved-down"}>{after >= before ? "+" : ""}{(after - before).toFixed(2)}</small></div>; })}</div><div className="agent-why"><strong>Waarom veranderde deze?</strong><p>Laatste invloed van <strong>{neighbour?.name}</strong> ({neighbour && ARCH[neighbour.archetype].label}).</p>{run.fired.filter((fired) => fired.round <= round).map((fired) => <span key={fired.round}><Zap size={10} />R{fired.round}: {fired.event.short}</span>)}</div></section>}
        </aside>
      </div>
      <div className="simulation-caption"><span><i /> Elke kleur toont een standpunt, geen kwaliteit van een persoon.</span><span>graph: degree 7 · rounds 24 · backfire bij conviction &gt; .60 · seed {run.seed}</span></div>
    </>}
  </div>;
}
