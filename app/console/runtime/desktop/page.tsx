"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getEnvironment, getSandbox } from "@/lib/gateway";
import { getBase } from "@/lib/environments";
import { desktopAppsIn } from "@/lib/desktop-apps";
import type { Environment, Sandbox } from "@/lib/types";

function DesktopBottleView() {
  const search = useSearchParams();
  const id = search.get("id") ?? "";
  const [entity, setEntity] = useState<Sandbox | Environment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    Promise.all([getSandbox(id), getEnvironment(id)])
      .then(([sb, env]) => setEntity(sb ?? env))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="p-8 text-sm text-zinc-500">Booting bottle…</p>;
  }

  if (!entity) {
    return <p className="p-8 text-sm text-red-400">Container not found.</p>;
  }

  const baseId =
    "baseId" in entity
      ? entity.settings.runtimeMode === "minios"
        ? entity.settings.miniosBaseId
        : entity.baseId
      : entity.settings.miniosBaseId;
  const base = getBase(baseId);
  const apps = "apps" in entity ? desktopAppsIn(entity.apps) : [];
  const isWindows = base.id === "windows";

  return (
    <div className="flex min-h-screen flex-col bg-[#1a1a2e]">
      <header className="flex items-center justify-between border-b border-black/40 bg-[#0f0f1a] px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-sm text-zinc-300">{entity.name}</span>
          <span className="text-xs text-zinc-500">· {base.label}</span>
        </div>
        <span className="rounded bg-nv-green/20 px-2 py-0.5 text-xs text-nv-green">running in tab</span>
      </header>

      <div
        className="relative flex-1 overflow-hidden"
        style={{
          background: isWindows
            ? "linear-gradient(180deg, #0078d4 0%, #1a1a2e 40%)"
            : "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 flex h-10 items-center gap-2 border-t border-black/30 bg-black/50 px-3 backdrop-blur">
          <button type="button" className="rounded bg-white/10 px-2 py-1 text-xs text-white">
            Menu
          </button>
          {apps.map((app) => (
            <button
              key={app.id}
              type="button"
              className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-nv-green/30"
            >
              {app.label}
            </button>
          ))}
          <button type="button" className="rounded bg-white/10 px-2 py-1 text-xs text-white">
            Terminal
          </button>
        </div>

        {apps.some((a) => a.id === "openttd") && (
          <div className="absolute inset-0 flex items-center justify-center p-8 pb-14">
            <div className="w-full max-w-3xl rounded-lg border border-ink-600 bg-ink-900 p-6 text-center shadow-2xl">
              <h2 className="text-lg font-medium text-white">OpenTTD</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Desktop bottle program running in this browser tab. The full game binary would stream
                from the in-tab mini OS runtime (WebContainer + WASM when cross-origin isolated).
              </p>
              <div className="mt-4 aspect-video rounded border border-dashed border-ink-600 bg-ink-950 flex items-center justify-center">
                <span className="text-4xl">🚂</span>
              </div>
            </div>
          </div>
        )}

        {!apps.length && (
          <div className="absolute inset-0 flex items-center justify-center pb-10">
            <p className="text-sm text-zinc-400">Desktop bottle — {base.label}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RuntimeDesktopPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Loading…</p>}>
      <DesktopBottleView />
    </Suspense>
  );
}
