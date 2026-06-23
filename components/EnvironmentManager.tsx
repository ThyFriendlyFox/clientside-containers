"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DRIVERS, type ComputeDriver, type Environment } from "@/lib/types";
import { APP_CATALOG, ENV_TEMPLATES, OS_BASES, getTemplate } from "@/lib/environments";
import { StatusBadge } from "./badges";

export function EnvironmentManager() {
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState<string>(ENV_TEMPLATES[0].id);
  const [name, setName] = useState("");
  const [baseId, setBaseId] = useState(ENV_TEMPLATES[0].baseId);
  const [apps, setApps] = useState<string[]>([...ENV_TEMPLATES[0].apps]);
  const [cpus, setCpus] = useState(ENV_TEMPLATES[0].resources.cpus);
  const [memoryMb, setMemoryMb] = useState(ENV_TEMPLATES[0].resources.memoryMb);
  const [diskGb, setDiskGb] = useState(ENV_TEMPLATES[0].resources.diskGb);
  const [driver, setDriver] = useState<ComputeDriver>("docker");
  const [autostart, setAutostart] = useState(false);

  const tmpl = useMemo(() => getTemplate(templateId), [templateId]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = getTemplate(id);
    if (t) {
      setBaseId(t.baseId);
      setApps([...t.apps]);
      setCpus(t.resources.cpus);
      setMemoryMb(t.resources.memoryMb);
      setDiskGb(t.resources.diskGb);
    }
  }

  async function refresh() {
    const res = await fetch("/api/environments");
    setEnvs(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh().catch((e) => {
      setError(String(e));
      setLoading(false);
    });
  }, []);

  function toggleApp(id: string) {
    setApps((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/environments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          templateId: templateId === "custom" ? null : templateId,
          baseId,
          apps,
          resources: { cpus, memoryMb, diskGb },
          driver,
          autostart,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setName("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/environments/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Environments</h2>
        {loading ? (
          <div className="card p-6 text-sm text-zinc-500">Loading…</div>
        ) : envs.length === 0 ? (
          <div className="card p-6 text-sm text-zinc-500">No environments yet. Create one on the right.</div>
        ) : (
          <div className="card divide-y divide-ink-800">
            {envs.map((env) => (
              <div key={env.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/console/environments/view?id=${env.id}`} className="truncate font-medium text-white hover:text-nv-green">
                      {env.name}
                    </Link>
                    <span className="font-mono text-xs text-zinc-500">{env.id}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                    <span>{OS_BASES.find((b) => b.id === env.baseId)?.label ?? env.baseId}</span>
                    <span>· {env.apps.join(", ") || "base only"}</span>
                    {env.autostart && <span className="text-nv-green">· autostart</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={env.status} />
                  <button onClick={() => remove(env.id)} className="btn-danger px-2.5 py-1.5 text-xs">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Create environment</h2>
        <form onSubmit={create} className="card space-y-4 p-5">
          <div>
            <label className="label">Template</label>
            <select className="input" value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
              {ENV_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {tmpl && <p className="mt-1.5 text-xs text-zinc-500">{tmpl.description}</p>}
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" placeholder="auto-generated" value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />
          </div>
          <div>
            <label className="label">OS base</label>
            <select className="input" value={baseId} onChange={(e) => setBaseId(e.target.value)}>
              <optgroup label="Desktop">
                {OS_BASES.filter((b) => b.family === "desktop").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Mobile">
                {OS_BASES.filter((b) => b.family === "mobile").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">{OS_BASES.find((b) => b.id === baseId)?.note}</p>
          </div>
          <div>
            <label className="label">Apps &amp; services</label>
            <div className="grid grid-cols-2 gap-2">
              {APP_CATALOG.map((app) => (
                <label key={app.id} className="flex items-center gap-2 rounded-md border border-ink-700 px-2.5 py-1.5 text-sm">
                  <input type="checkbox" checked={apps.includes(app.id)} onChange={() => toggleApp(app.id)} className="accent-nv-green" />
                  <span className="truncate">{app.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">vCPU</label>
              <input type="number" min={1} className="input" value={cpus} onChange={(e) => setCpus(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">RAM MB</label>
              <input type="number" min={256} step={256} className="input" value={memoryMb} onChange={(e) => setMemoryMb(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Disk GB</label>
              <input type="number" min={1} className="input" value={diskGb} onChange={(e) => setDiskGb(Number(e.target.value))} />
            </div>
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={autostart} onChange={(e) => setAutostart(e.target.checked)} className="accent-nv-green" />
            Start on boot when exported
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Creating…" : "Create environment"}
          </button>
        </form>
      </section>
    </div>
  );
}
