import { store, newId, appendLog } from "./store";
import { DEFAULT_POLICY, PRESETS, policyToYaml } from "./policy";
import { getTemplate } from "./environments";
import { defaultSettingsForEnvironment } from "./containers";
import { DEFAULT_CONTAINER_SETTINGS } from "./container-settings";
import type { Provider, Sandbox, Environment } from "./types";

function policyYamlForPreset(presetId: string | null | undefined): string {
  let policy = DEFAULT_POLICY;
  if (presetId) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) policy = preset.apply(DEFAULT_POLICY);
  }
  return policyToYaml(policy);
}

/** Populate the in-memory store with demo sandboxes and environments. */
export function seedStore(): void {
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
    driver: "browser",
    provider: claudeProvider.name,
    status: "running",
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    policyYaml: policyToYaml(githubPolicy),
    logs: [],
    settings: { ...DEFAULT_CONTAINER_SETTINGS },
  };
  appendLog(demo, "info", "Sandbox provisioned in browser (Web Worker runtime).");
  appendLog(demo, "info", "Agent openclaw started with provider claude-managed.");
  appendLog(demo, "allow", "GET api.github.com:443 allowed by \"github-api-readonly\".");
  appendLog(demo, "deny", "POST api.github.com:443 not permitted by policy (read-only).");
  store.sandboxes.set(demo.id, demo);

  const tmpl = getTemplate("windows-n8n-chrome")!;
  const env: Environment = {
    id: newId("env"),
    name: "win-automation",
    templateId: tmpl.id,
    baseId: tmpl.baseId,
    apps: [...tmpl.apps],
    resources: { ...tmpl.resources },
    driver: "browser",
    status: "running",
    policyYaml: policyYamlForPreset(tmpl.presetId),
    autostart: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    logs: [],
    settings: defaultSettingsForEnvironment({ baseId: tmpl.baseId }),
  };
  appendLog(env, "info", "Environment provisioned from template windows-n8n-chrome.");
  appendLog(env, "info", "Mini OS bottle booted in browser.");
  appendLog(env, "info", "Services started: desktop, chrome (CDP), n8n.");
  appendLog(env, "info", "n8n wired to Chrome CDP at ws://chrome:3000.");
  store.environments.set(env.id, env);
}
