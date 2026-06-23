"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AGENTS, type EgressResult, type Sandbox } from "@/lib/types";
import { StatusBadge, VerdictBadge } from "./badges";

const LOG_COLORS: Record<string, string> = {
  info: "text-zinc-400",
  allow: "text-nv-green",
  route: "text-sky-300",
  deny: "text-red-400",
};

export function SandboxDetail({ id }: { id: string }) {
  const [sandbox, setSandbox] = useState<Sandbox | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [policyDraft, setPolicyDraft] = useState("");
  const [policyMsg, setPolicyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Egress tester state
  const [binary, setBinary] = useState("/usr/bin/curl");
  const [host, setHost] = useState("api.github.com");
  const [port, setPort] = useState(443);
  const [method, setMethod] = useState("GET");
  const [result, setResult] = useState<EgressResult | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/sandboxes/${id}`);
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    const data = (await res.json()) as Sandbox;
    setSandbox(data);
    setPolicyDraft((prev) => (prev === "" ? data.policyYaml : prev));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function savePolicy() {
    setSaving(true);
    setPolicyMsg(null);
    try {
      const res = await fetch(`/api/sandboxes/${id}/policy`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ policy: policyDraft }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to apply policy");
      setSandbox(body as Sandbox);
      setPolicyMsg({ ok: true, text: "Policy hot-reloaded on the running sandbox." });
    } catch (err) {
      setPolicyMsg({ ok: false, text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function runEgress(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/sandboxes/${id}/egress`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ binary, host, port: Number(port), method }),
    });
    if (res.ok) {
      setResult((await res.json()) as EgressResult);
      await load();
    }
  }

  if (notFound) {
    return (
      <div className="card p-6 text-sm text-zinc-400">
        Sandbox <span className="font-mono">{id}</span> was not found.{" "}
        <Link href="/console/sandboxes" className="text-nv-green hover:underline">
          Back to sandboxes
        </Link>
      </div>
    );
  }

  if (!sandbox) {
    return <div className="card p-6 text-sm text-zinc-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">{sandbox.name}</h1>
            <StatusBadge status={sandbox.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-500">{sandbox.id}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="badge border-ink-600 text-zinc-300">{AGENTS[sandbox.agent].label}</span>
          <span className="badge border-ink-600 text-zinc-300">{sandbox.driver}</span>
          {sandbox.provider && <span className="badge border-ink-600 text-zinc-300">{sandbox.provider}</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-white">Policy</h2>
            <span className="text-xs text-zinc-500">network + inference hot-reload</span>
          </div>
          <textarea
            className="input h-80 resize-y font-mono text-xs leading-relaxed"
            value={policyDraft}
            spellCheck={false}
            onChange={(e) => setPolicyDraft(e.target.value)}
          />
          {policyMsg && (
            <p className={`mt-2 text-sm ${policyMsg.ok ? "text-nv-green" : "text-red-400"}`}>{policyMsg.text}</p>
          )}
          <div className="mt-3 flex gap-2">
            <button onClick={savePolicy} className="btn-primary" disabled={saving}>
              {saving ? "Applying…" : "Apply policy"}
            </button>
            <button onClick={() => setPolicyDraft(sandbox.policyYaml)} className="btn-ghost">
              Reset
            </button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 font-medium text-white">Egress check</h2>
            <p className="mb-3 text-sm text-zinc-400">
              Probe an outbound request against the current policy. The engine returns allow, route, or deny.
            </p>
            <form onSubmit={runEgress} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Method</label>
                  <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Port</label>
                  <input
                    type="number"
                    className="input"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Host</label>
                <input className="input" value={host} onChange={(e) => setHost(e.target.value)} />
              </div>
              <div>
                <label className="label">Binary</label>
                <input className="input font-mono" value={binary} onChange={(e) => setBinary(e.target.value)} />
              </div>
              <button type="submit" className="btn-ghost w-full">
                Run egress check
              </button>
            </form>
            {result && (
              <div className="mt-4 rounded-md border border-ink-700 bg-ink-950/50 p-3">
                <div className="flex items-center gap-2">
                  <VerdictBadge verdict={result.verdict} />
                  {result.matchedBlock && (
                    <span className="font-mono text-xs text-zinc-500">{result.matchedBlock}</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-zinc-300">{result.detail}</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-medium text-white">Activity</h2>
        <div className="max-h-80 overflow-y-auto rounded-md border border-ink-700 bg-ink-950/60 p-3 font-mono text-xs">
          {sandbox.logs.length === 0 ? (
            <p className="text-zinc-600">No activity yet.</p>
          ) : (
            [...sandbox.logs].reverse().map((log, i) => (
              <div key={i} className="flex gap-3 py-0.5">
                <span className="shrink-0 text-zinc-600">{new Date(log.ts).toLocaleTimeString()}</span>
                <span className={`shrink-0 uppercase ${LOG_COLORS[log.level]}`}>{log.level}</span>
                <span className="text-zinc-300">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
