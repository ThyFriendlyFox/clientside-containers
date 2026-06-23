"use client";

import { useEffect, useState } from "react";
import type { ContainerSettings, ContainerView } from "@/lib/types";
import { MINIOS_BASE_OPTIONS } from "@/lib/containers";
import { NETWORK_EGRESS_OPTIONS, SAFETY_PROFILES } from "@/lib/container-settings";
import { OS_BASES } from "@/lib/environments";

interface Props {
  container: ContainerView | null;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: ContainerView) => void;
}

export function ContainerSettingsModal({ container, open, onClose, onSaved }: Props) {
  const [settings, setSettings] = useState<ContainerSettings | null>(null);
  const [policyYaml, setPolicyYaml] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (container && open) {
      setSettings({ ...container.settings });
      setPolicyYaml(container.policyYaml);
      setError(null);
    }
  }, [container, open]);

  if (!open || !container || !settings) return null;

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        kind: container!.kind,
        settings,
      };
      if (settings.networkEgress === "custom") {
        body.policyYaml = policyYaml;
      }
      const res = await fetch(`/api/containers/${container!.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      onSaved(data as ContainerView);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-ink-700 bg-ink-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{container.name}</h2>
            <p className="text-xs text-zinc-500">{container.kind} · {container.id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="space-y-6 p-5">
          {/* Runtime */}
          <section>
            <h3 className="text-sm font-medium text-white">Runtime</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Headless runs services only. Minified OS expands into a desktop bottle you can open in the browser.
            </p>
            <div className="mt-3 flex gap-2">
              {(["headless", "minios"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSettings({ ...settings, runtimeMode: mode })}
                  className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize transition-colors ${
                    settings.runtimeMode === mode
                      ? "border-nv-green bg-nv-green/10 text-nv-green"
                      : "border-ink-600 text-zinc-400 hover:border-ink-500"
                  }`}
                >
                  {mode === "minios" ? "Minified OS" : "Headless"}
                </button>
              ))}
            </div>
            {settings.runtimeMode === "minios" && (
              <div className="mt-3">
                <label className="label">OS bottle</label>
                <select
                  className="input"
                  value={settings.miniosBaseId}
                  onChange={(e) => setSettings({ ...settings, miniosBaseId: e.target.value })}
                >
                  {MINIOS_BASE_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500">
                  {OS_BASES.find((b) => b.id === settings.miniosBaseId)?.note}
                </p>
              </div>
            )}
          </section>

          {/* Networking */}
          <section>
            <h3 className="text-sm font-medium text-white">Networking</h3>
            <p className="mt-1 text-xs text-zinc-500">OpenShell egress rules — hot-reloadable on a running container.</p>
            <div className="mt-3 space-y-2">
              {NETWORK_EGRESS_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors ${
                    settings.networkEgress === opt.id ? "border-nv-green/50 bg-nv-green/5" : "border-ink-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="egress"
                    checked={settings.networkEgress === opt.id}
                    onChange={() => setSettings({ ...settings, networkEgress: opt.id })}
                    className="mt-0.5 accent-nv-green"
                  />
                  <div>
                    <div className="text-sm text-white">{opt.label}</div>
                    <div className="text-xs text-zinc-500">{opt.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Safety */}
          <section>
            <h3 className="text-sm font-medium text-white">Safety rules</h3>
            <p className="mt-1 text-xs text-zinc-500">Defense-in-depth profiles for filesystem, network, process, and inference.</p>
            <div className="mt-3 space-y-2">
              {SAFETY_PROFILES.map((prof) => (
                <label
                  key={prof.id}
                  className={`flex cursor-pointer gap-3 rounded-md border p-3 transition-colors ${
                    settings.safetyProfile === prof.id ? "border-nv-green/50 bg-nv-green/5" : "border-ink-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="safety"
                    checked={settings.safetyProfile === prof.id}
                    onChange={() => setSettings({ ...settings, safetyProfile: prof.id })}
                    className="mt-0.5 accent-nv-green"
                  />
                  <div>
                    <div className="text-sm text-white">{prof.label}</div>
                    <div className="text-xs text-zinc-500">{prof.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={settings.allowInferenceRouting}
                onChange={(e) => setSettings({ ...settings, allowInferenceRouting: e.target.checked })}
                className="accent-nv-green"
              />
              Route model API calls through managed inference backends
            </label>
          </section>

          {settings.networkEgress === "custom" && (
            <section>
              <h3 className="text-sm font-medium text-white">Custom policy YAML</h3>
              <textarea
                className="input mt-2 h-40 font-mono text-xs"
                value={policyYaml}
                spellCheck={false}
                onChange={(e) => setPolicyYaml(e.target.value)}
              />
            </section>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-700 px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={save} className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Apply settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
