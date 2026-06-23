"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AGENTS, DRIVERS, type AgentKind, type ComputeDriver, type Provider, type Sandbox } from "@/lib/types";
import { PRESET_META } from "@/lib/presets-meta";
import { StatusBadge } from "./badges";

export function SandboxManager() {
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [agent, setAgent] = useState<AgentKind>("openclaw");
  const [driver, setDriver] = useState<ComputeDriver>("docker");
  const [provider, setProvider] = useState("");
  const [presetId, setPresetId] = useState("");

  async function refresh() {
    const [sRes, pRes] = await Promise.all([fetch("/api/sandboxes"), fetch("/api/providers")]);
    setSandboxes(await sRes.json());
    setProviders(await pRes.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((e) => {
      setError(String(e));
      setLoading(false);
    });
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sandboxes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          agent,
          driver,
          provider: provider || null,
          presetId: presetId || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setName("");
      setPresetId("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/sandboxes/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Sandboxes</h2>
        {loading ? (
          <div className="card p-6 text-sm text-zinc-500">Loading…</div>
        ) : sandboxes.length === 0 ? (
          <div className="card p-6 text-sm text-zinc-500">No sandboxes yet. Create one on the right.</div>
        ) : (
          <div className="card divide-y divide-ink-800">
            {sandboxes.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/console/sandboxes/${s.id}`} className="truncate font-medium text-white hover:text-nv-green">
                      {s.name}
                    </Link>
                    <span className="font-mono text-xs text-zinc-500">{s.id}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                    <span>{AGENTS[s.agent].label}</span>
                    <span>· {s.driver}</span>
                    {s.provider && <span>· {s.provider}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={s.status} />
                  <button onClick={() => remove(s.id)} className="btn-danger px-2.5 py-1.5 text-xs">
                    Terminate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Create sandbox</h2>
        <form onSubmit={create} className="card space-y-4 p-5">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="auto-generated"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
            />
          </div>
          <div>
            <label className="label">Agent</label>
            <select className="input" value={agent} onChange={(e) => setAgent(e.target.value as AgentKind)}>
              {Object.entries(AGENTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Compute driver</label>
            <select className="input" value={driver} onChange={(e) => setDriver(e.target.value as ComputeDriver)}>
              {DRIVERS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Provider</label>
            <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
              <option value="">none</option>
              {providers.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.kind})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Initial policy preset</label>
            <select className="input" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
              <option value="">minimal (default)</option>
              {PRESET_META.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating…" : "Create sandbox"}
          </button>
        </form>
      </section>
    </div>
  );
}
