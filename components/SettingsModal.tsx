"use client";

import { useState } from "react";
import { TIERS, tierUsesEmulator, type Container, type ContainerSettings } from "@/lib/container";

interface Props {
  container: Container;
  onSave: (name: string, settings: Partial<ContainerSettings>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const NETWORKS: { value: ContainerSettings["network"]; label: string }[] = [
  { value: "off", label: "Off — no egress" },
  { value: "restricted", label: "Restricted — allowlist only" },
  { value: "open", label: "Open — all egress" },
];

const MEMORY_OPTIONS = [64, 128, 192, 256, 384, 512];

export function SettingsModal({ container, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(container.name);
  const [memoryMb, setMemoryMb] = useState(container.settings.memoryMb);
  const [network, setNetwork] = useState(container.settings.network);
  const [autostart, setAutostart] = useState(container.settings.autostart);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Container settings</h2>
          <span className="badge border-ink-600 text-zinc-400">{TIERS[container.tier].label}</span>
        </div>

        <label className="label">Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

        {tierUsesEmulator(container.tier) && (
          <>
            <label className="label mt-4">Memory</label>
            <select
              className="input"
              value={memoryMb}
              onChange={(e) => setMemoryMb(Number(e.target.value))}
            >
              {MEMORY_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} MiB
                </option>
              ))}
            </select>
          </>
        )}

        <label className="label mt-4">Networking</label>
        <select
          className="input"
          value={network}
          onChange={(e) => setNetwork(e.target.value as ContainerSettings["network"])}
        >
          {NETWORKS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>

        <label className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={autostart}
            onChange={(e) => setAutostart(e.target.checked)}
            className="h-4 w-4 rounded border-ink-600 bg-ink-950"
          />
          Start automatically when the dashboard loads
        </label>

        <p className="mt-3 text-xs text-zinc-500">
          Memory and networking apply on next start.
        </p>

        <div className="mt-6 flex items-center justify-between">
          {confirmDelete ? (
            <button type="button" onClick={onDelete} className="btn-danger text-sm">
              Confirm delete
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger text-sm">
              Delete
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(name, { memoryMb, network, autostart })}
              className="btn-primary text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
