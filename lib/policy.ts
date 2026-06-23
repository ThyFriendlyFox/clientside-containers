import yaml from "js-yaml";
import type { EgressRequest, EgressResult } from "./types";

// Declarative policy shape, mirroring OpenShell's policy.yaml.
// See: https://github.com/NVIDIA/OpenShell/blob/main/examples/sandbox-policy-quickstart/policy.yaml

export interface NetworkEndpoint {
  host: string;
  port: number;
  protocol: "rest" | "https" | "tcp";
  enforcement: "enforce" | "observe";
  access: "read-only" | "read-write";
}

export interface NetworkBlock {
  name: string;
  endpoints: NetworkEndpoint[];
  binaries: { path: string }[];
}

export interface InferenceRoute {
  name: string;
  host: string;
  port: number;
  backend: string;
}

export interface Policy {
  version: number;
  filesystem_policy: {
    include_workdir: boolean;
    read_only: string[];
    read_write: string[];
  };
  landlock: { compatibility: "best_effort" | "strict" };
  process: { run_as_user: string; run_as_group: string };
  network_policies: Record<string, NetworkBlock>;
  inference_policies?: Record<string, InferenceRoute>;
}

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const DEFAULT_POLICY: Policy = {
  version: 1,
  filesystem_policy: {
    include_workdir: true,
    read_only: ["/usr", "/lib", "/proc", "/dev/urandom", "/app", "/etc", "/var/log"],
    read_write: ["/sandbox", "/tmp", "/dev/null"],
  },
  landlock: { compatibility: "best_effort" },
  process: { run_as_user: "sandbox", run_as_group: "sandbox" },
  network_policies: {},
};

export function policyToYaml(policy: Policy): string {
  const header =
    "# Managed by NemoClaw Console. Static sections (filesystem, process) are\n" +
    "# locked at sandbox creation; network and inference sections hot-reload.\n\n";
  return header + yaml.dump(policy, { lineWidth: 100, noRefs: true, sortKeys: false });
}

export function parsePolicy(text: string): Policy {
  const parsed = yaml.load(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Policy must be a YAML mapping");
  }
  const p = parsed as Partial<Policy>;
  return {
    ...DEFAULT_POLICY,
    ...p,
    filesystem_policy: { ...DEFAULT_POLICY.filesystem_policy, ...(p.filesystem_policy ?? {}) },
    process: { ...DEFAULT_POLICY.process, ...(p.process ?? {}) },
    landlock: { ...DEFAULT_POLICY.landlock, ...(p.landlock ?? {}) },
    network_policies: p.network_policies ?? {},
    inference_policies: p.inference_policies,
  };
}

export interface PolicyPreset {
  id: string;
  label: string;
  description: string;
  apply: (policy: Policy) => Policy;
}

export const PRESETS: PolicyPreset[] = [
  {
    id: "github-readonly",
    label: "GitHub API (read-only)",
    description: "Allow curl to GET from api.github.com. Write methods are blocked at L7.",
    apply: (p) => ({
      ...p,
      network_policies: {
        ...p.network_policies,
        github_api: {
          name: "github-api-readonly",
          endpoints: [
            { host: "api.github.com", port: 443, protocol: "rest", enforcement: "enforce", access: "read-only" },
          ],
          binaries: [{ path: "/usr/bin/curl" }],
        },
      },
    }),
  },
  {
    id: "npm-registry",
    label: "npm registry",
    description: "Allow node/npm to fetch packages from registry.npmjs.org.",
    apply: (p) => ({
      ...p,
      network_policies: {
        ...p.network_policies,
        npm_registry: {
          name: "npm-registry",
          endpoints: [
            { host: "registry.npmjs.org", port: 443, protocol: "https", enforcement: "enforce", access: "read-only" },
          ],
          binaries: [{ path: "/usr/bin/node" }, { path: "/usr/local/bin/npm" }],
        },
      },
    }),
  },
  {
    id: "pypi",
    label: "PyPI",
    description: "Allow python/uv to install packages from pypi.org and files.pythonhosted.org.",
    apply: (p) => ({
      ...p,
      network_policies: {
        ...p.network_policies,
        pypi: {
          name: "pypi",
          endpoints: [
            { host: "pypi.org", port: 443, protocol: "https", enforcement: "enforce", access: "read-only" },
            { host: "files.pythonhosted.org", port: 443, protocol: "https", enforcement: "enforce", access: "read-only" },
          ],
          binaries: [{ path: "/usr/bin/python" }, { path: "/usr/local/bin/uv" }],
        },
      },
    }),
  },
  {
    id: "anthropic-inference",
    label: "Routed inference (Anthropic)",
    description: "Route api.anthropic.com through the privacy router with managed backend credentials.",
    apply: (p) => ({
      ...p,
      inference_policies: {
        ...(p.inference_policies ?? {}),
        anthropic: {
          name: "anthropic-managed",
          host: "api.anthropic.com",
          port: 443,
          backend: "nvidia-managed-inference",
        },
      },
    }),
  },
];

// Mirror OpenShell's three-way decision: allow, route-for-inference, or deny.
export function evaluateEgress(policy: Policy, req: EgressRequest): EgressResult {
  const method = req.method.toUpperCase();

  const inference = policy.inference_policies ?? {};
  for (const [key, route] of Object.entries(inference)) {
    if (route.host === req.host && route.port === req.port) {
      return {
        verdict: "route",
        matchedBlock: key,
        detail: `Routed to inference backend "${route.backend}" — caller credentials stripped.`,
      };
    }
  }

  for (const [key, block] of Object.entries(policy.network_policies)) {
    const endpoint = block.endpoints.find((e) => e.host === req.host && e.port === req.port);
    if (!endpoint) continue;

    const binaryAllowed = block.binaries.some((b) => b.path === req.binary);
    if (!binaryAllowed) {
      return {
        verdict: "deny",
        matchedBlock: key,
        detail: `Binary ${req.binary} is not permitted by block "${block.name}".`,
      };
    }

    if (READ_METHODS.has(method)) {
      return {
        verdict: "allow",
        matchedBlock: key,
        detail: `${method} ${req.host}:${req.port} allowed by "${block.name}".`,
      };
    }

    if (endpoint.access === "read-only") {
      return {
        verdict: "deny",
        matchedBlock: key,
        detail: `${method} ${req.host}:${req.port} not permitted by policy (read-only).`,
      };
    }

    return {
      verdict: "allow",
      matchedBlock: key,
      detail: `${method} ${req.host}:${req.port} allowed by "${block.name}" (read-write).`,
    };
  }

  return {
    verdict: "deny",
    detail: `No policy block matches ${req.host}:${req.port}. Default egress is minimal.`,
  };
}
