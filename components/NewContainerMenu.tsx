"use client";

import { useState } from "react";
import { TIERS, type ContainerTier } from "@/lib/container";
import { AGENT_PRESETS } from "@/lib/agents";
import { OS_IMAGES } from "@/lib/os-images";
import { CONFIGS } from "@/lib/configs";

interface Props {
  onCreate: (tier: ContainerTier, selectionId: string) => void;
  onClose: () => void;
}

const TIER_ORDER: ContainerTier[] = ["agent", "app", "minios"];

export function NewContainerMenu({ onCreate, onClose }: Props) {
  const [agentId, setAgentId] = useState(AGENT_PRESETS[0].id);
  const [configId, setConfigId] = useState(CONFIGS[0].id);
  const [imageId, setImageId] = useState(OS_IMAGES[0].id);

  const selectionFor = (tier: ContainerTier) =>
    tier === "agent" ? agentId : tier === "app" ? configId : imageId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="card max-h-[90vh] w-full max-w-lg overflow-auto p-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2 className="text-lg font-semibold text-white">New container</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Try any AI system, app, or OS — on any device, with no host to set up. Pick a tier; bigger
          tiers wrap more OS around the same idea.
        </p>

        <div className="mt-4 space-y-3">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className="rounded-lg border border-ink-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="mt-0.5 text-nv-green">
                    <path d={TIERS[tier].icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-white">{TIERS[tier].label}</h3>
                    <p className="text-xs text-zinc-400">{TIERS[tier].blurb}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCreate(tier, selectionFor(tier))}
                  className="btn-primary shrink-0 text-sm"
                >
                  Create
                </button>
              </div>

              {tier === "agent" && (
                <>
                  <select
                    className="input mt-3"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    aria-label="Agent preset"
                  >
                    {AGENT_PRESETS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label} — {a.vendor}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-zinc-500">
                    {AGENT_PRESETS.find((a) => a.id === agentId)?.blurb} Built on{" "}
                    <a className="text-nv-green hover:underline" href="https://github.com/NVIDIA/NemoClaw" target="_blank" rel="noreferrer">
                      NemoClaw
                    </a>{" "}
                    +{" "}
                    <a className="text-nv-green hover:underline" href="https://github.com/NVIDIA/OpenShell" target="_blank" rel="noreferrer">
                      OpenShell
                    </a>
                    .
                  </p>
                </>
              )}

              {tier === "app" && (
                <select
                  className="input mt-3"
                  value={configId}
                  onChange={(e) => setConfigId(e.target.value)}
                  aria-label="Config"
                >
                  {CONFIGS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} — {c.blurb}
                    </option>
                  ))}
                </select>
              )}

              {tier === "minios" && (
                <select
                  className="input mt-3"
                  value={imageId}
                  onChange={(e) => setImageId(e.target.value)}
                  aria-label="OS image"
                >
                  {OS_IMAGES.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label} — {i.blurb}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
