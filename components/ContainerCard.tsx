"use client";

import { TIERS, getBottledApp, type Container } from "@/lib/container";

const STATUS_DOT: Record<Container["status"], string> = {
  stopped: "bg-zinc-500",
  booting: "bg-amber-400 animate-pulse",
  running: "bg-nv-green",
  error: "bg-red-400",
};

interface Props {
  container: Container;
  onOpen: () => void;
  onSettings: () => void;
}

export function ContainerCard({ container, onOpen, onSettings }: Props) {
  const tier = TIERS[container.tier];
  const subtitle =
    container.tier === "app" ? getBottledApp(container.appId).label : tier.label;

  return (
    <article className="card group relative flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col items-stretch text-left"
        aria-label={`Open ${container.name}`}
      >
        <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-ink-700 bg-ink-950">
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            className="text-ink-600 transition-colors group-hover:text-nv-green/70"
          >
            <path d={tier.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="absolute inset-x-0 bottom-0 translate-y-full bg-nv-green/90 py-1 text-center text-xs font-medium text-black transition-transform group-hover:translate-y-0">
            {container.status === "running" ? "Open interface" : "Start & open"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-white">{container.name}</h3>
            <p className="truncate text-xs text-zinc-500">{subtitle}</p>
          </div>
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[container.status]}`} title={container.status} />
        </div>
      </button>
      <button
        type="button"
        onClick={onSettings}
        className="absolute right-2 top-2 rounded-md border border-ink-700 bg-ink-900/80 p-1.5 text-zinc-400 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100 focus:opacity-100"
        aria-label={`Settings for ${container.name}`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </button>
    </article>
  );
}
