"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Environment } from "@/lib/types";
import { OS_BASES, getTemplate } from "@/lib/environments";
import { desktopAppsIn } from "@/lib/desktop-apps";
import { environmentEndpoints } from "@/lib/compose";
import { StatusBadge } from "./badges";

interface BundleFile {
  path: string;
  content: string;
}

interface ExportPreview {
  slug: string;
  files: BundleFile[];
}

export function EnvironmentDetail({ id }: { id: string }) {
  const [env, setEnv] = useState<Environment | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [activeFile, setActiveFile] = useState<string>("docker-compose.yml");

  const load = useCallback(async () => {
    const res = await fetch(`/api/environments/${id}`);
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    setEnv((await res.json()) as Environment);
    const pRes = await fetch(`/api/environments/${id}/export?format=json`);
    if (pRes.ok) setPreview((await pRes.json()) as ExportPreview);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function downloadBundle() {
    const res = await fetch(`/api/environments/${id}/export`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nemoclaw-${env?.name ?? id}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function toggleAutostart(next: boolean) {
    const res = await fetch(`/api/environments/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ autostart: next }),
    });
    if (res.ok) setEnv((await res.json()) as Environment);
  }

  if (notFound) {
    return (
      <div className="card p-6 text-sm text-zinc-400">
        Environment <span className="font-mono">{id}</span> was not found.{" "}
        <Link href="/console/environments" className="text-nv-green hover:underline">
          Back to environments
        </Link>
      </div>
    );
  }

  if (!env) return <div className="card p-6 text-sm text-zinc-500">Loading…</div>;

  const base = OS_BASES.find((b) => b.id === env.baseId);
  const tmpl = getTemplate(env.templateId);
  const fileContent = preview?.files.find((f) => f.path === activeFile)?.content ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{env.name}</h1>
            <StatusBadge status={env.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-500">{env.id}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge border-ink-600 text-zinc-300">{base?.label ?? env.baseId}</span>
          <span className="badge border-ink-600 text-zinc-300">{env.driver}</span>
          <span className="badge border-ink-600 text-zinc-300">
            {env.resources.cpus} vCPU · {env.resources.memoryMb} MB · {env.resources.diskGb} GB
          </span>
        </div>
      </div>

      {tmpl && (
        <section className="card p-5">
          <h2 className="font-medium text-white">How it is wired</h2>
          <p className="mt-2 text-sm text-zinc-400">{tmpl.wiring}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {env.apps.map((a) => (
              <span key={a} className="badge border-nv-green/30 bg-nv-green/5 text-nv-green">
                {a}
              </span>
            ))}
          </div>
        </section>
      )}

      {base && base.desktop !== "none" && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium text-white">Desktop bottle</h2>
            <a
              href={`http://localhost:${base.guiPort}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
            >
              Open desktop
            </a>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            This environment is a mini OS in a container — like a Bottles prefix, but a full Linux
            desktop streamed to your browser. Export the bundle, run{" "}
            <span className="font-mono text-zinc-300">docker compose up -d</span>, then open the
            desktop URL and use the installed programs.
          </p>
          {desktopAppsIn(env.apps).length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-zinc-400">
              {desktopAppsIn(env.apps).map((app) => (
                <li key={app.id}>
                  <span className="text-white">{app.label}</span>
                  {app.autostart ? " — autostarts when the bottle boots" : " — launch from the desktop menu"}
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-3 space-y-1 text-xs text-zinc-500">
            {environmentEndpoints(env).map((ep) => (
              <li key={ep.label}>
                <span className="text-zinc-400">{ep.label}:</span> {ep.url}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-medium text-white">Export &amp; run locally</h2>
          <button onClick={downloadBundle} className="btn-primary">
            Download bundle (.zip)
          </button>
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          The bundle contains a Compose project, the OpenShell policy, start/stop scripts, and
          autostart units for systemd, launchd, and Windows Task Scheduler. Run it with
          <span className="font-mono text-zinc-300"> docker compose up -d</span>, or open it in the
          NemoClaw Desktop app to manage start-on-boot.
        </p>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={env.autostart}
              onChange={(e) => toggleAutostart(e.target.checked)}
              className="accent-nv-green"
            />
            Start on boot (sets autostart in the exported bundle)
          </label>
        </div>

        {preview && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1.5">
              {preview.files.map((f) => (
                <button
                  key={f.path}
                  onClick={() => setActiveFile(f.path)}
                  className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                    activeFile === f.path
                      ? "bg-nv-green/15 text-nv-green"
                      : "text-zinc-400 hover:bg-ink-800 hover:text-white"
                  }`}
                >
                  {f.path}
                </button>
              ))}
            </div>
            <pre className="mt-3 max-h-96 overflow-auto rounded-md border border-ink-700 bg-ink-950/60 p-4 text-xs leading-relaxed text-zinc-300">
              <code>{fileContent}</code>
            </pre>
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-medium text-white">Activity</h2>
        <div className="max-h-64 overflow-y-auto rounded-md border border-ink-700 bg-ink-950/60 p-3 font-mono text-xs">
          {[...env.logs].reverse().map((log, i) => (
            <div key={i} className="flex gap-3 py-0.5">
              <span className="shrink-0 text-zinc-600">{new Date(log.ts).toLocaleTimeString()}</span>
              <span className="text-zinc-300">{log.message}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
