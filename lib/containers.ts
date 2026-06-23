import { AGENTS, type ContainerKind, type ContainerSettings, type ContainerView, type Environment, type Sandbox } from "./types";
import { DEFAULT_CONTAINER_SETTINGS, mergeSettings, policyForSettings } from "./container-settings";
import { getBase, OS_BASES } from "./environments";
import { parsePolicy, policyToYaml } from "./policy";

export function defaultSettingsForEnvironment(env: Pick<Environment, "baseId">): ContainerSettings {
  const base = getBase(env.baseId);
  return {
    ...DEFAULT_CONTAINER_SETTINGS,
    runtimeMode: base.desktop !== "none" || base.family === "mobile" ? "minios" : "headless",
    miniosBaseId: base.family === "mobile" ? env.baseId : env.baseId === "headless" ? "ubuntu-desktop" : env.baseId,
  };
}

export function sandboxToView(s: Sandbox): ContainerView {
  const minios = s.settings.runtimeMode === "minios";
  const base = minios ? getBase(s.settings.miniosBaseId) : null;
  return {
    id: s.id,
    kind: "sandbox",
    name: s.name,
    status: s.status,
    driver: s.driver,
    createdAt: s.createdAt,
    settings: s.settings,
    policyYaml: s.policyYaml,
    subtitle: AGENTS[s.agent].label,
    desktopUrl: minios && base && base.desktop !== "none" ? `http://localhost:${base.guiPort}` : null,
    detailHref: `/console/sandboxes/view?id=${s.id}`,
  };
}

export function environmentToView(e: Environment): ContainerView {
  const minios = e.settings.runtimeMode === "minios";
  const baseId = minios ? e.settings.miniosBaseId : e.baseId;
  const base = getBase(baseId);
  return {
    id: e.id,
    kind: "environment",
    name: e.name,
    status: e.status,
    driver: e.driver,
    createdAt: e.createdAt,
    settings: e.settings,
    policyYaml: e.policyYaml,
    subtitle: e.apps.length ? e.apps.join(", ") : base.label,
    desktopUrl: minios && base.desktop !== "none" ? `http://localhost:${base.guiPort}` : null,
    detailHref: `/console/environments/view?id=${e.id}`,
  };
}

export function listContainerViews(sandboxes: Sandbox[], environments: Environment[]): ContainerView[] {
  return [...sandboxes.map(sandboxToView), ...environments.map(environmentToView)].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export interface UpdateContainerInput {
  kind: ContainerKind;
  settings?: Partial<ContainerSettings>;
  policyYaml?: string;
}

export function applyContainerUpdate(
  target: Sandbox | Environment,
  input: UpdateContainerInput,
): { settings: ContainerSettings; policyYaml: string } {
  const settings = mergeSettings(target.settings, input.settings ?? {});
  let policyYaml = target.policyYaml;

  if (input.policyYaml !== undefined) {
    parsePolicy(input.policyYaml);
    policyYaml = input.policyYaml;
    settings.networkEgress = "custom";
  } else if (input.settings && settings.networkEgress !== "custom") {
    policyYaml = policyForSettings(settings);
  }

  return { settings, policyYaml };
}

export const MINIOS_BASE_OPTIONS = OS_BASES.filter((b) => b.desktop !== "none" || b.family === "mobile");
