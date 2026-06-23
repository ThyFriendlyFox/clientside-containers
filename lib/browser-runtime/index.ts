import type { Environment, Sandbox } from "../types";
import { appendLog } from "../store";
import { getBase } from "../environments";
import { desktopAppsIn } from "../desktop-apps";
import { BASE_PATH } from "../base-path";

export type RuntimeKind = "worker" | "webcontainer" | "desktop-frame";

export interface RuntimeInstance {
  id: string;
  kind: RuntimeKind;
  status: "starting" | "running" | "stopped" | "error";
  desktopPath: string | null;
  worker?: Worker;
}

const instances = new Map<string, RuntimeInstance>();

// Path used as a next/link href — the framework applies the base path, so this
// returns the route without it to avoid double-prefixing.
export function runtimeDesktopPath(id: string): string {
  return `/console/runtime/desktop/?id=${encodeURIComponent(id)}`;
}

export function getRuntime(id: string): RuntimeInstance | undefined {
  return instances.get(id);
}

export function listRuntimes(): RuntimeInstance[] {
  return [...instances.values()];
}

function workerUrl(): string {
  return `${BASE_PATH}/workers/sandbox-worker.js`;
}

async function startWorkerSandbox(sandbox: Sandbox): Promise<RuntimeInstance> {
  const inst: RuntimeInstance = {
    id: sandbox.id,
    kind: "worker",
    status: "starting",
    desktopPath: null,
  };
  instances.set(sandbox.id, inst);

  try {
    const worker = new Worker(workerUrl(), { type: "classic" });
    inst.worker = worker;
    worker.onmessage = (ev) => {
      const { type, message } = ev.data ?? {};
      if (type === "started") inst.status = "running";
      if (type === "tick" && message) appendLog(sandbox, "info", message);
    };
    worker.postMessage({ type: "start", payload: { id: sandbox.id, agent: sandbox.agent } });
    inst.status = "running";
    appendLog(sandbox, "info", "Web Worker runtime active in this tab.");
  } catch (err) {
    inst.status = "error";
    appendLog(sandbox, "info", `Worker start failed: ${(err as Error).message}`);
  }

  return inst;
}

async function tryWebContainerHeadless(id: string): Promise<boolean> {
  if (!crossOriginIsolated) return false;
  try {
    const { WebContainer } = await import("@webcontainer/api");
    const wc = await WebContainer.boot();
    const inst = instances.get(id);
    if (inst) {
      inst.kind = "webcontainer";
      inst.status = "running";
    }
    await wc.spawn("node", ["-e", "console.log('clientside-containers: headless runtime ready')"]);
    return true;
  } catch {
    return false;
  }
}

async function startDesktopFrame(env: Environment): Promise<RuntimeInstance> {
  const base = getBase(env.settings.runtimeMode === "minios" ? env.settings.miniosBaseId : env.baseId);
  const inst: RuntimeInstance = {
    id: env.id,
    kind: "desktop-frame",
    status: "starting",
    desktopPath: base.desktop !== "none" ? runtimeDesktopPath(env.id) : null,
  };
  instances.set(env.id, inst);

  const apps = desktopAppsIn(env.apps);
  inst.status = "running";
  appendLog(
    env,
    "info",
    `Desktop bottle streaming in browser (${base.label}${apps.length ? `, apps: ${apps.map((a) => a.label).join(", ")}` : ""}).`,
  );
  return inst;
}

export async function startContainer(entity: Sandbox | Environment): Promise<RuntimeInstance> {
  const existing = instances.get(entity.id);
  if (existing && existing.status === "running") return existing;

  if ("agent" in entity) {
    const sandbox = entity as Sandbox;
    if (sandbox.settings.runtimeMode === "minios") {
      return startDesktopFrame({
        ...sandbox,
        baseId: sandbox.settings.miniosBaseId,
        apps: [],
        templateId: null,
        resources: { cpus: 2, memoryMb: 4096, diskGb: 16 },
        autostart: false,
      } as Environment);
    }
    const inst = await startWorkerSandbox(sandbox);
    if (sandbox.settings.runtimeMode === "headless") {
      void tryWebContainerHeadless(sandbox.id);
    }
    return inst;
  }

  const env = entity as Environment;
  if (env.settings.runtimeMode === "headless") {
    return startWorkerSandbox({
      id: env.id,
      name: env.name,
      agent: "openclaw",
      driver: env.driver,
      provider: null,
      status: env.status,
      createdAt: env.createdAt,
      policyYaml: env.policyYaml,
      logs: env.logs,
      settings: env.settings,
    });
  }
  return startDesktopFrame(env);
}

export async function stopContainer(id: string): Promise<void> {
  const inst = instances.get(id);
  if (!inst) return;
  if (inst.worker) {
    inst.worker.postMessage({ type: "stop", payload: { id } });
    inst.worker.terminate();
  }
  inst.status = "stopped";
  instances.delete(id);
}

export async function hydrateBrowserRuntime(
  sandboxes: Sandbox[],
  environments: Environment[],
): Promise<void> {
  const running = [...sandboxes, ...environments].filter((e) => e.status === "running");
  await Promise.all(running.map((e) => startContainer(e)));
}

export function runtimeCapabilities(): {
  crossOriginIsolated: boolean;
  webContainers: boolean;
  workers: boolean;
} {
  return {
    crossOriginIsolated: typeof crossOriginIsolated !== "undefined" && crossOriginIsolated,
    webContainers: typeof crossOriginIsolated !== "undefined" && crossOriginIsolated,
    workers: typeof Worker !== "undefined",
  };
}
