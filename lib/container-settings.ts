import { DEFAULT_POLICY, PRESETS, policyToYaml, type Policy } from "./policy";
import type { ContainerSettings, NetworkEgress, SafetyProfile } from "./types";

export const DEFAULT_CONTAINER_SETTINGS: ContainerSettings = {
  runtimeMode: "headless",
  miniosBaseId: "ubuntu-desktop",
  networkEgress: "minimal",
  safetyProfile: "balanced",
  allowInferenceRouting: false,
};

export const NETWORK_EGRESS_OPTIONS: { id: NetworkEgress; label: string; description: string }[] = [
  { id: "minimal", label: "Minimal", description: "Deny all outbound by default. Hot-reload rules to open access." },
  { id: "restricted", label: "Restricted", description: "Allow read-only access to common registries and APIs." },
  { id: "custom", label: "Custom", description: "Use the policy YAML you define below." },
];

export const SAFETY_PROFILES: { id: SafetyProfile; label: string; description: string }[] = [
  { id: "strict", label: "Strict", description: "No outbound network. Filesystem and process rules locked at creation." },
  { id: "balanced", label: "Balanced", description: "Read-only GitHub API access for typical agent workflows." },
  { id: "permissive", label: "Permissive", description: "npm, PyPI, and GitHub read access for development bottles." },
];

export function policyForSettings(settings: ContainerSettings): string {
  if (settings.networkEgress === "minimal" && settings.safetyProfile === "strict" && !settings.allowInferenceRouting) {
    return policyToYaml({ ...DEFAULT_POLICY, network_policies: {}, inference_policies: undefined });
  }
  let policy: Policy = { ...DEFAULT_POLICY };
  if (settings.safetyProfile === "balanced" || settings.networkEgress === "restricted") {
    const p = PRESETS.find((x) => x.id === "github-readonly");
    if (p) policy = p.apply(policy);
  }
  if (settings.safetyProfile === "permissive") {
    for (const id of ["npm-registry", "pypi"] as const) {
      const p = PRESETS.find((x) => x.id === id);
      if (p) policy = p.apply(policy);
    }
  }
  if (settings.allowInferenceRouting) {
    const p = PRESETS.find((x) => x.id === "anthropic-inference");
    if (p) policy = p.apply(policy);
  }
  return policyToYaml(policy);
}

export function mergeSettings(
  current: ContainerSettings,
  patch: Partial<ContainerSettings>,
): ContainerSettings {
  return { ...current, ...patch };
}
