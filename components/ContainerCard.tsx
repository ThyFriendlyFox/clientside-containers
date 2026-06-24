"use client";

import { TIERS, containerSubtitle, type Container } from "@/lib/container";

const STATUS_DOT: Record<Container["status"], string> = {
  stopped: "bg-gray-600",
  booting: "bg-amber-600 animate-pulse",
  running: "bg-green-700",
  error: "bg-red-700",
};

interface Props {
  container: Container;
  onOpen: () => void;
  onSettings: () => void;
}

export function ContainerCard({ container, onOpen, onSettings }: Props) {
  const tier = TIERS[container.tier];
  const subtitle = containerSubtitle(container);

  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow duration-150 ease-geist hover:shadow-popover">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col items-stretch text-left focus-visible:outline-none"
        aria-label={`Open ${container.name}`}
      >
        <div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-gray-alpha-400 bg-gray-100">
          {container.preview?.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={container.preview.data} alt="" className="h-full w-full object-cover" />
          ) : container.preview?.kind === "text" ? (
            <pre className="h-full w-full overflow-hidden whitespace-pre-wrap p-2 text-left font-mono text-[8px] leading-[1.25] text-gray-800">
              {container.preview.data}
            </pre>
          ) : (
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              className="text-gray-500 transition-colors group-hover:text-gray-800"
            >
              <path d={tier.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {container.preview && (
            <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-sm bg-gray-alpha-800 px-1.5 py-0.5 text-label-12 text-background-100">
              Preview
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gray-1000 py-1 text-center text-button-12 text-background-100 transition-transform duration-150 ease-geist group-hover:translate-y-0">
            {container.status === "running" ? "Open Interface" : "Start & Open"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="min-w-0">
            <h3 className="truncate text-heading-14 text-gray-1000">{container.name}</h3>
            <p className="truncate text-label-12 text-gray-700">{subtitle}</p>
          </div>
          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[container.status]}`} title={container.status} />
        </div>
      </button>
      <button
        type="button"
        onClick={onSettings}
        className="absolute right-2 top-2 rounded-sm border border-gray-alpha-400 bg-background-100 p-1.5 text-gray-700 opacity-0 shadow-card transition-opacity duration-150 ease-geist hover:bg-gray-100 hover:text-gray-1000 group-hover:opacity-100 focus-visible:opacity-100"
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
