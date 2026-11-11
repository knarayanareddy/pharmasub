import { AlertTriangle, Check, CircleHelp, Clock3, X } from "lucide-react";
import type { ReactNode } from "react";
import type { SourceRef, Verdict } from "@/domain/types";

export function RuleChip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "valid" | "reject" | "unknown" }) {
  return <span className={`rule-chip ${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: Verdict }) {
  if (status === "geldig") return <span className="status-badge valid"><Check size={14} /> GELDIG</span>;
  if (status === "afgewezen") return <span className="status-badge reject"><X size={14} /> AFGEWEZEN</span>;
  return <span className="status-badge unknown"><CircleHelp size={14} /> ONBEKEND</span>;
}

export function FlagPill({ children }: { children: ReactNode }) {
  return <span className="flag-pill"><AlertTriangle size={13} />{children}</span>;
}

export function SourceLine({ source, children, compact = false }: { source: SourceRef | { doc: string; date: string; sha256?: string }; children: ReactNode; compact?: boolean }) {
  return <div className={`sourced-field ${compact ? "compact" : ""}`} data-field data-source={source.doc} data-date={source.date} data-sha256={source.sha256 || "n.v.t."}>
    <div className="field-value">{children}</div>
    <div className="source-line"><BookOpenIcon /> <span>{source.doc}</span><time>{source.date}</time></div>
  </div>;
}

function BookOpenIcon() {
  return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 3.5c2-.6 4-.2 6 1.2 2-1.4 4-1.8 6-1.2v9c-2-.6-4-.2-6 1.2-2-1.4-4-1.8-6-1.2v-9Z" stroke="currentColor" strokeWidth="1.2"/><path d="M8 4.7v9" stroke="currentColor" strokeWidth="1.2"/></svg>;
}

export function StatTile({ value, label, note, icon }: { value: string; label: string; note?: string; icon?: ReactNode }) {
  return <div className="stat-tile"><div className="stat-value">{icon}{value}</div><div className="stat-label">{label}</div>{note && <div className="stat-note">{note}</div>}</div>;
}

export function Pending({ children }: { children: ReactNode }) {
  return <span className="pending"><Clock3 size={14} />{children}</span>;
}
