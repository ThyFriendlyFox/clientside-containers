import { store, newId, appendLog } from "./store";
import {
  DEFAULT_POLICY,
  PRESETS,
  parsePolicy,
  policyToYaml,
  evaluateEgress,
} from "./policy";
import type {
  AgentKind,
  ComputeDriver,
  EgressRequest,
  EgressResult,
  Provider,
  Sandbox,
} from "./types";

export const MODE = process.env.NEMOCLAW_CONSOLE_MODE === "gateway" ? "gateway" : "simulation";
export const GATEWAY_URL = process.env.OPENSHELL_GATEWAY_URL ?? "";

export interface CreateSandboxInput {
  name?: string;
  agent: AgentKind;
  driver: ComputeDriver;
  provider?: string | null;
  presetId?: string | null;
}

export interface CreateProviderInput {
  name: string;
  kind: string;
  key: string;
}

function seed(): void {
  if (store.seeded) return;
  store.seeded = true;

  const claudeProvider: Provider = {
    id: newId("prov"),
    name: "claude-managed",
    kind: "anthropic",
    keyHint: "sk-ant-…7f2a",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  };
  store.providers.set(claudeProvider.id, claudeProvider);

  const githubPolicy = PRESETS.find((p) => p.id === "github-readonly")!.apply(DEFAULT_POLICY);
  const demo: Sandbox = {
    id: newId("sbx"),
    name: "demo",
    agent: "openclaw",
    driver: "docker",
    provider: claudeProvider.name,
    status: "running",
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    policyYaml: policyToYaml(githubPolicy),
    logs: [],
  };
  appendLog(demo, "info", "Sandbox provisioned on docker driver.");
  appendLog(demo, "info", "Agent openclaw started with provider claude-managed.");
  appendLog(demo, "allow", "GET api.github.com:443 allowed by \"github-api-readonly\".");
  appendLog(demo, "deny", "POST api.github.com:443 not permitted by policy (read-only).");
  store.sandboxes.set(demo.id, demo);
}

function ensureGatewayConfigured(): void {
  if (MODE === "gateway" && !GATEWAY_URL) {
    throw new Error(
      "NEMOCLAW_CONSOLE_MODE=gateway requires OPENSHELL_GATEWAY_URL to be set.",
    );
  }
}

async function gatewayFetch(path: string, init?: RequestInit): Promise<Response> {
  ensureGatewayConfigured();
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  const token = process.env.OPENSHELL_GATEWAY_TOKEN;
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(`${GATEWAY_URL.replace(/\/$/, "")}${path}`, { ...init, headers });
}

// ---------------------------------------------------------------------------
// Public API used by route handlers
// ---------------------------------------------------------------------------

export async function listSandboxes(): Promise<Sandbox[]> {
  if (MODE === "gateway") {
    const res = await gatewayFetch("/v1/sandboxes");
    if (!res.ok) throw new Error(`Gateway error ${res.status}`);
    return (await res.json()) as Sandbox[];
  }
  seed();
  return [...store.sandboxes.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getSandbox(id: string): Promise<Sandbox | null> {
  if (MODE === "gateway") {
    const res = await gatewayFetch(`/v1/sandboxes/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Gateway error ${res.status}`);
    return (await res.json()) as Sandbox;
  }
  seed();
  return store.sandboxes.get(id) ?? null;
}

export async function createSandbox(input: CreateSandboxInput): Promise<Sandbox> {
  if (MODE === "gateway") {
    const res = await gatewayFetch("/v1/sandboxes", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Gateway error ${res.status}`);
    return (await res.json()) as Sandbox;
  }
  seed();
  let policy = DEFAULT_POLICY;
  if (input.presetId) {
    const preset = PRESETS.find((p) => p.id === input.presetId);
    if (preset) policy = preset.apply(DEFAULT_POLICY);
  }
  const sandbox: Sandbox = {
    id: newId("sbx"),
    name: input.name?.trim() || newId("sbx"),
    agent: input.agent,
    driver: input.driver,
    provider: input.provider ?? null,
    status: "running",
    createdAt: new Date().toISOString(),
    policyYaml: policyToYaml(policy),
    logs: [],
  };
  appendLog(sandbox, "info", `Sandbox provisioned on ${sandbox.driver} driver.`);
  appendLog(
    sandbox,
    "info",
    `Agent ${sandbox.agent} started${sandbox.provider ? ` with provider ${sandbox.provider}` : ""}.`,
  );
  store.sandboxes.set(sandbox.id, sandbox);
  return sandbox;
}

export async function deleteSandbox(id: string): Promise<boolean> {
  if (MODE === "gateway") {
    const res = await gatewayFetch(`/v1/sandboxes/${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.ok;
  }
  seed();
  return store.sandboxes.delete(id);
}

export async function setPolicy(id: string, policyYaml: string): Promise<Sandbox | null> {
  // Validate the YAML regardless of mode.
  parsePolicy(policyYaml);
  if (MODE === "gateway") {
    const res = await gatewayFetch(`/v1/sandboxes/${encodeURIComponent(id)}/policy`, {
      method: "PUT",
      body: JSON.stringify({ policy: policyYaml }),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Gateway error ${res.status}`);
    return (await res.json()) as Sandbox;
  }
  seed();
  const sandbox = store.sandboxes.get(id);
  if (!sandbox) return null;
  sandbox.policyYaml = policyYaml;
  appendLog(sandbox, "info", "Network/inference policy hot-reloaded.");
  return sandbox;
}

export async function execEgress(id: string, req: EgressRequest): Promise<EgressResult | null> {
  if (MODE === "gateway") {
    const res = await gatewayFetch(`/v1/sandboxes/${encodeURIComponent(id)}/egress-check`, {
      method: "POST",
      body: JSON.stringify(req),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Gateway error ${res.status}`);
    return (await res.json()) as EgressResult;
  }
  seed();
  const sandbox = store.sandboxes.get(id);
  if (!sandbox) return null;
  const policy = parsePolicy(sandbox.policyYaml);
  const result = evaluateEgress(policy, req);
  appendLog(sandbox, result.verdict, `${req.method} ${req.host}:${req.port} — ${result.detail}`);
  return result;
}

export async function listProviders(): Promise<Provider[]> {
  if (MODE === "gateway") {
    const res = await gatewayFetch("/v1/providers");
    if (!res.ok) throw new Error(`Gateway error ${res.status}`);
    return (await res.json()) as Provider[];
  }
  seed();
  return [...store.providers.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createProvider(input: CreateProviderInput): Promise<Provider> {
  if (MODE === "gateway") {
    const res = await gatewayFetch("/v1/providers", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Gateway error ${res.status}`);
    return (await res.json()) as Provider;
  }
  seed();
  const trimmed = input.key.trim();
  const hint = trimmed.length > 6 ? `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}` : "••••";
  const provider: Provider = {
    id: newId("prov"),
    name: input.name.trim(),
    kind: input.kind.trim(),
    keyHint: hint,
    createdAt: new Date().toISOString(),
  };
  store.providers.set(provider.id, provider);
  return provider;
}

export async function deleteProvider(id: string): Promise<boolean> {
  if (MODE === "gateway") {
    const res = await gatewayFetch(`/v1/providers/${encodeURIComponent(id)}`, { method: "DELETE" });
    return res.ok;
  }
  seed();
  return store.providers.delete(id);
}
