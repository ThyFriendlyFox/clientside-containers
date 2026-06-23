"use client";

import { useState } from "react";
import Link from "next/link";
import type { ContainerView } from "@/lib/types";
import { StatusBadge } from "./badges";

interface Props {
  container: ContainerView;
  onOpenSettings: () => void;
}

export function ContainerCard({ container, onOpenSettings }: Props) {
  const [expanded, setExpanded] = useState(container.settings.runtimeMode === "minios");

  const isMinios = container.settings.runtimeMode === "minios";

  return (
    <article className="card flex flex-col overflow-hidden transition-colors hover:border-ink-600">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-medium text-white">{container.name}</h3>
            <p className="mt-0.5 truncate text-xs text-zinc-500">{container.subtitle}</p>
          </div>
          <StatusBadge status={container.status} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="badge border-ink-600 text-zinc-400">{container.kind}</span>
          <span className={`badge ${isMinios ? "border-nv-green/40 bg-nv-green/10 text-nv-green" : "border-ink-600 text-zinc-400"}`}>
            {isMinios ? "minified OS" : "headless"}
          </span>
          <span className="badge border-ink-600 text-zinc-500">{container.driver}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {isMinios && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="btn-ghost px-2.5 py-1.5 text-xs"
            >
              {expanded ? "Collapse" : "Expand bottle"}
            </button>
          )}
          {isMinios && container.desktopUrl && (
            <a href={container.desktopUrl} target="_blank" rel="noreferrer" className="btn-primary px-2.5 py-1.5 text-xs">
              Open desktop
            </a>
          )}
          <button type="button" onClick={onOpenSettings} className="btn-ghost px-2.5 py-1.5 text-xs">
            Settings
          </button>
          <Link href={container.detailHref} className="btn-ghost px-2.5 py-1.5 text-xs">
            Details
          </Link>
        </div>
      </div>

      {expanded && isMinios && (
        <div className="border-t border-ink-700 bg-ink-950/80 p-4">
          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-ink-600 bg-ink-900">
            {container.desktopUrl ? (
              <div className="text-center">
                <p className="text-sm text-zinc-400">Desktop bottle running</p>
                <a
                  href={container.desktopUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-nv-green hover:underline"
                >
                  {container.desktopUrl}
                </a>
                <p className="mt-2 text-xs text-zinc-600">
                  Export the bundle and run <span className="font-mono">docker compose up -d</span> to connect.
                </p>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Mobile / non-GUI bottle — interact via ADB or Appium endpoints.</p>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Safety: {container.settings.safetyProfile} · Network: {container.settings.networkEgress}
          </p>
        </div>
      )}
    </article>
  );
}
