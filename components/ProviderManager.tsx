"use client";

import { useEffect, useState } from "react";
import type { Provider } from "@/lib/types";

export function ProviderManager() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("anthropic");
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const res = await fetch("/api/providers");
    setProviders(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, kind, key }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setName("");
      setKey("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/providers/${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Registered providers</h2>
        {loading ? (
          <div className="card p-6 text-sm text-zinc-500">Loading…</div>
        ) : providers.length === 0 ? (
          <div className="card p-6 text-sm text-zinc-500">No providers registered yet.</div>
        ) : (
          <div className="card divide-y divide-ink-800">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="font-medium text-white">{p.name}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{p.kind}</span>
                    <span className="font-mono">{p.keyHint}</span>
                  </div>
                </div>
                <button onClick={() => remove(p.id)} className="btn-danger px-2.5 py-1.5 text-xs">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-white">Add provider</h2>
        <form onSubmit={create} className="card space-y-4 p-5">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="claude-managed" required />
          </div>
          <div>
            <label className="label">Kind</label>
            <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
              {["anthropic", "openai", "google", "azure", "custom"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Credential</label>
            <input
              className="input font-mono"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="API key or token"
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Register provider"}
          </button>
        </form>
      </section>
    </div>
  );
}
