import {
  idbDeleteEnvironment,
  idbDeleteProvider,
  idbDeleteSandbox,
  idbIsSeeded,
  idbLoadEnvironments,
  idbLoadProviders,
  idbLoadSandboxes,
  idbMarkSeeded,
  idbPutEnvironment,
  idbPutProvider,
  idbPutSandbox,
} from "./idb-store";
import { seedStore } from "./seed";
import { store } from "./store";
import type { Environment, Provider, Sandbox } from "./types";

export const isBrowser = (): boolean => typeof window !== "undefined";

let initPromise: Promise<void> | null = null;

/** Hydrate in-memory store from IndexedDB, seed on first visit. */
export async function initClientsideStore(): Promise<void> {
  if (!isBrowser()) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const seeded = await idbIsSeeded();
    if (!seeded) {
      seedStore();
      await persistAll();
      await idbMarkSeeded();
    } else {
      const [sandboxes, environments, providers] = await Promise.all([
        idbLoadSandboxes(),
        idbLoadEnvironments(),
        idbLoadProviders(),
      ]);
      store.sandboxes.clear();
      store.environments.clear();
      store.providers.clear();
      for (const s of sandboxes) store.sandboxes.set(s.id, s);
      for (const e of environments) store.environments.set(e.id, e);
      for (const p of providers) store.providers.set(p.id, p);
      store.seeded = true;
    }
  })();

  return initPromise;
}

export async function persistAll(): Promise<void> {
  if (!isBrowser()) return;
  await Promise.all([
    ...[...store.sandboxes.values()].map((s) => idbPutSandbox(s)),
    ...[...store.environments.values()].map((e) => idbPutEnvironment(e)),
    ...[...store.providers.values()].map((p) => idbPutProvider(p)),
  ]);
}

export async function persistSandbox(sandbox: Sandbox): Promise<void> {
  if (!isBrowser()) return;
  await idbPutSandbox(sandbox);
}

export async function persistEnvironment(env: Environment): Promise<void> {
  if (!isBrowser()) return;
  await idbPutEnvironment(env);
}

export async function persistProvider(provider: Provider): Promise<void> {
  if (!isBrowser()) return;
  await idbPutProvider(provider);
}

export async function removeSandbox(id: string): Promise<void> {
  if (!isBrowser()) return;
  await idbDeleteSandbox(id);
}

export async function removeEnvironment(id: string): Promise<void> {
  if (!isBrowser()) return;
  await idbDeleteEnvironment(id);
}

export async function removeProvider(id: string): Promise<void> {
  if (!isBrowser()) return;
  await idbDeleteProvider(id);
}
