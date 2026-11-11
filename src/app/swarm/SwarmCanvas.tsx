"use client";

import { useEffect, useRef } from "react";
import { ARCH, type ArchetypeKey, type Dimension } from "@/domain/swarm/archetypes";
import type { SwarmRun } from "@/domain/swarm/engine";

interface NodePoint { x: number; y: number; vx: number; vy: number; archetype: ArchetypeKey; index: number }
interface Props {
  run: SwarmRun;
  round: number;
  dimension: Dimension;
  decisionLine: number;
  ghost: { left: number; swing: number; right: number } | null;
  onSelect: (index: number) => void;
  onFps: (fps: number) => void;
}

const archetypeKeys = Object.keys(ARCH) as ArchetypeKey[];
const shortLabels: Record<ArchetypeKey, string> = { pharm_ind: "APOTHEKER", pharm_tech: "ASSISTENT", pharm_chain: "KETEN", pharm_hosp: "ZIEKENHUIS", gp: "HUISARTS", patient: "PATIËNT", insurer: "VERZEKERAAR", wholesaler: "GROOTHANDEL", regulator: "INSPECTIE", import: "IMPORT" };

export default function SwarmCanvas({ run, round, dimension, decisionLine, ghost, onSelect, onFps }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ round, dimension, decisionLine, ghost, onSelect, onFps });
  stateRef.current = { round, dimension, decisionLine, ghost, onSelect, onFps };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;
    let width = 800, height = 540, dpr = 1, frame = 0, alpha = 1, raf = 0;
    let hovered = -1;
    let frames = 0, fpsTime = performance.now();
    const centres = new Map<ArchetypeKey, { x: number; y: number }>();
    const nodes: NodePoint[] = run.personas.map((persona, index) => ({ x: 0, y: 0, vx: 0, vy: 0, archetype: persona.archetype, index }));

    function layout() {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(300, rect.width); height = Math.max(360, rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const radiusX = Math.max(115, width * .34), radiusY = Math.max(125, height * .33);
      archetypeKeys.forEach((key, index) => {
        const angle = -Math.PI / 2 + index / archetypeKeys.length * Math.PI * 2;
        centres.set(key, { x: width / 2 + Math.cos(angle) * radiusX, y: height / 2 + Math.sin(angle) * radiusY });
      });
      nodes.forEach((node, index) => {
        if (node.x === 0 && node.y === 0) {
          const centre = centres.get(node.archetype)!;
          const angle = index * 2.39996;
          const radius = 12 + index % 7 * 5;
          node.x = centre.x + Math.cos(angle) * radius; node.y = centre.y + Math.sin(angle) * radius;
        }
        node.x = Math.max(8, Math.min(width - 8, node.x)); node.y = Math.max(8, Math.min(height - 8, node.y));
      });
    }
    layout();
    const observer = new ResizeObserver(layout); observer.observe(canvas);

    function physics() {
      alpha *= .992;
      for (const node of nodes) {
        const centre = centres.get(node.archetype)!;
        const isHub = run.personas.findIndex((p) => p.archetype === node.archetype) === node.index;
        const attraction = (isHub ? .03 : .012) * alpha;
        node.vx += (centre.x - node.x) * attraction; node.vy += (centre.y - node.y) * attraction;
      }
      for (let a = 0; a < nodes.length; a++) {
        for (let b = a + 1; b < nodes.length; b++) {
          const first = nodes[a], second = nodes[b];
          const dx = second.x - first.x, dy = second.y - first.y;
          const distance2 = dx * dx + dy * dy + .01, distance = Math.sqrt(distance2);
          const radius = first.archetype === second.archetype ? 20 : 13;
          if (distance < radius) {
            const force = radius * radius / distance2 * .35 * alpha;
            const fx = dx / distance * force, fy = dy / distance * force;
            first.vx -= fx; first.vy -= fy; second.vx += fx; second.vy += fy;
          }
        }
      }
      for (const edge of run.edges) {
        const source = nodes[edge.source], target = nodes[edge.target];
        const dx = target.x - source.x, dy = target.y - source.y;
        const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const rest = edge.local ? 34 : 120, stiffness = edge.local ? .01 : .0012;
        const force = (distance - rest) * stiffness * alpha;
        const fx = dx / distance * force, fy = dy / distance * force;
        source.vx += fx; source.vy += fy; target.vx -= fx; target.vy -= fy;
      }
      for (const node of nodes) {
        node.vx *= .84; node.vy *= .84;
        node.vx = Math.max(-12, Math.min(12, node.vx)); node.vy = Math.max(-12, Math.min(12, node.vy));
        node.x = Math.max(7, Math.min(width - 7, node.x + node.vx)); node.y = Math.max(18, Math.min(height - 22, node.y + node.vy));
      }
    }

    function draw(time: number) {
      const current = stateRef.current;
      const snapshot = run.snapshots[current.round];
      context.fillStyle = "#14202b"; context.fillRect(0, 0, width, height);
      context.strokeStyle = "rgba(255,255,255,.025)"; context.lineWidth = 1;
      for (let x = 0; x < width; x += 48) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
      for (let y = 0; y < height; y += 48) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
      for (const [key, centre] of centres) {
        const gradient = context.createRadialGradient(centre.x, centre.y, 2, centre.x, centre.y, 92);
        gradient.addColorStop(0, key === "regulator" ? "rgba(80,160,129,.12)" : "rgba(130,160,180,.08)"); gradient.addColorStop(1, "rgba(20,32,43,0)");
        context.fillStyle = gradient; context.beginPath(); context.arc(centre.x, centre.y, 92, 0, Math.PI * 2); context.fill();
        if (current.ghost) {
          context.strokeStyle = "rgba(255,255,255,.25)"; context.setLineDash([3, 4]);
          context.beginPath(); context.arc(centre.x, centre.y, 30 + current.ghost.right / 8, 0, Math.PI * 2); context.stroke(); context.setLineDash([]);
        }
      }
      context.lineWidth = .55;
      for (const edge of run.edges) {
        const source = nodes[edge.source], target = nodes[edge.target];
        context.strokeStyle = edge.local ? "rgba(170,190,200,.10)" : "rgba(115,158,184,.14)";
        context.beginPath(); context.moveTo(source.x, source.y); context.lineTo(target.x, target.y); context.stroke();
      }
      for (const node of nodes) {
        const opinion = snapshot.opinions[node.index][current.dimension];
        const moved = Math.abs(snapshot.opinions[node.index][current.dimension] - run.initial[node.index][current.dimension]) > .01;
        const colour = opinion > current.decisionLine + .035 ? "#36a474" : opinion < current.decisionLine - .035 ? "#c44b43" : "#8c97a1";
        const isHub = run.personas.findIndex((p) => p.archetype === node.archetype) === node.index;
        context.globalAlpha = moved ? .94 : .28;
        context.fillStyle = colour; context.beginPath(); context.arc(node.x, node.y, isHub ? 5.5 : node.index === hovered ? 5 : 3.2, 0, Math.PI * 2); context.fill();
        if (isHub) { context.strokeStyle = "rgba(255,255,255,.7)"; context.lineWidth = .8; context.stroke(); }
        if (node.index === hovered) { context.strokeStyle = "white"; context.lineWidth = 1.4; context.beginPath(); context.arc(node.x, node.y, 8, 0, Math.PI * 2); context.stroke(); }
      }
      context.globalAlpha = 1;
      if (snapshot.event) {
        for (let index = 0; index < Math.min(24, run.edges.length); index++) {
          const edge = run.edges[(index * 17 + frame) % run.edges.length], source = nodes[edge.source], target = nodes[edge.target];
          const progress = (time % 380) / 380;
          context.fillStyle = "rgba(240,200,100,.75)"; context.beginPath(); context.arc(source.x + (target.x - source.x) * progress, source.y + (target.y - source.y) * progress, 1.7, 0, Math.PI * 2); context.fill();
        }
      }
      context.font = "8px 'IBM Plex Mono', monospace"; context.textAlign = "center";
      for (const [key, centre] of centres) {
        const members = nodes.filter((node) => node.archetype === key);
        const maxY = Math.max(...members.map((node) => node.y));
        context.fillStyle = "rgba(220,230,235,.62)"; context.fillText(`${shortLabels[key]} · ${ARCH[key].n}`, centre.x, Math.min(height - 7, maxY + 14));
      }
      context.textAlign = "left"; context.fillStyle = "rgba(255,255,255,.55)"; context.font = "8px Inter, sans-serif";
      context.fillText(`RONDE ${current.round}/${run.rounds}  ·  ${run.edges.length} VERBINDINGEN`, 12, 17);
      context.textAlign = "right"; context.fillStyle = "rgba(255,255,255,.35)"; context.fillText("gestippeld = vorige eindstand", width - 12, 17);
    }

    function animate(time: number) {
      physics(); draw(time); frame++; frames++;
      if (time - fpsTime >= 1000) { stateRef.current.onFps(Math.round(frames * 1000 / (time - fpsTime))); frames = 0; fpsTime = time; }
      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);

    function locate(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
      let nearest = -1, distance = 100;
      nodes.forEach((node) => { const d = (node.x - x) ** 2 + (node.y - y) ** 2; if (d < distance) { nearest = node.index; distance = d; } });
      hovered = nearest; canvas.style.cursor = nearest >= 0 ? "pointer" : "default"; return nearest;
    }
    const move = (event: PointerEvent) => locate(event);
    const click = (event: PointerEvent) => { const index = locate(event); if (index >= 0) stateRef.current.onSelect(index); };
    canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerdown", click);
    return () => { cancelAnimationFrame(raf); observer.disconnect(); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerdown", click); };
  }, [run]);

  return <canvas ref={canvasRef} className="swarm-canvas" aria-label={`Krachtennetwerk van 240 synthetische agenten, ronde ${round}`} />;
}
