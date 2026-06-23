"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ContainerView } from "@/lib/types";
import { ContainerCard } from "./ContainerCard";
import { ContainerSettingsModal } from "./ContainerSettingsModal";

export function ContainerGrid() {
  const [containers, setContainers] = useState<ContainerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsTarget, setSettingsTarget] = useState<ContainerView | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/containers");
    setContainers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  function handleSaved(updated: ContainerView) {
    setContainers((prev) => prev.map((c) => (c.id === updated.id && c.kind === updated.kind ? updated : c)));
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Containers</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            All running sandboxes and environments in one grid. Expand any container into a minified OS bottle,
            or keep it headless — open Settings to switch runtime, networking, and safety rules.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/console/sandboxes" className="btn-ghost text-sm">
            + Sandbox
          </Link>
          <Link href="/console/environments" className="btn-primary text-sm">
            + Environment
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="card p-8 text-center text-sm text-zinc-500">Loading containers…</div>
      ) : containers.length === 0 ? (
        <div className="card p-8 text-center text-sm text-zinc-500">
          No containers yet.{" "}
          <Link href="/console/sandboxes" className="text-nv-green hover:underline">
            Create a sandbox
          </Link>{" "}
          or{" "}
          <Link href="/console/environments" className="text-nv-green hover:underline">
            environment
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {containers.map((c) => (
            <ContainerCard
              key={`${c.kind}-${c.id}`}
              container={c}
              onOpenSettings={() => setSettingsTarget(c)}
            />
          ))}
        </div>
      )}

      <ContainerSettingsModal
        container={settingsTarget}
        open={settingsTarget !== null}
        onClose={() => setSettingsTarget(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
