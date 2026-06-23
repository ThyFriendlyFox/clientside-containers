"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initClientsideStore } from "@/lib/clientside-store";
import { hydrateBrowserRuntime, runtimeCapabilities } from "@/lib/browser-runtime";
import { store } from "@/lib/store";
import { listSandboxes, listEnvironments } from "@/lib/gateway";

export interface ClientsideContextValue {
  ready: boolean;
  mode: "clientside";
  capabilities: ReturnType<typeof runtimeCapabilities>;
}

const ClientsideContext = createContext<ClientsideContextValue>({
  ready: false,
  mode: "clientside",
  capabilities: { crossOriginIsolated: false, webContainers: false, workers: false },
});

export function useClientside(): ClientsideContextValue {
  return useContext(ClientsideContext);
}

type FetchFn = typeof fetch;

interface PatchFlag {
  __cscFetchPatched?: boolean;
}

function installFetchShim(): void {
  if (typeof window === "undefined") return;
  const flag = window as unknown as PatchFlag;
  if (flag.__cscFetchPatched) return;
  flag.__cscFetchPatched = true;

  const original: FetchFn = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    try {
      let url: string;
      let method = init?.method ?? "GET";
      let forwardInit = init;

      if (typeof input === "string") {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else {
        const req = input as Request;
        url = req.url;
        method = init?.method ?? req.method ?? "GET";
        if (!forwardInit) {
          const text = await req.clone().text();
          forwardInit = { method, body: text || undefined };
        }
      }

      const u = new URL(url, window.location.href);
      const apiIndex = u.pathname.indexOf("/api/");
      if (apiIndex !== -1) {
        const apiPath = u.pathname.slice(apiIndex);
        const { handleClientsideRequest } = await import("@/lib/clientside-api");
        return handleClientsideRequest(apiPath, u.searchParams, method, forwardInit);
      }
    } catch {
      // Fall through to real fetch on parse errors.
    }
    return original(input, init);
  };
}

/** Register cross-origin isolation service worker so WebContainers can boot on static hosts. */
async function registerCoiServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (window.crossOriginIsolated) return;
  try {
    const base = process.env.PAGES_BASE_PATH ?? "";
    await navigator.serviceWorker.register(`${base}/coi-serviceworker.js`);
  } catch {
    // COI SW is optional — workers still run without it.
  }
}

export function ClientsideProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [capabilities, setCapabilities] = useState(runtimeCapabilities());

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      installFetchShim();
      await registerCoiServiceWorker();
      await initClientsideStore();
      const [sandboxes, environments] = await Promise.all([listSandboxes(), listEnvironments()]);
      await hydrateBrowserRuntime(sandboxes, environments);
      if (!cancelled) {
        setCapabilities(runtimeCapabilities());
        setReady(true);
      }
    }

    boot().catch(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ClientsideContext.Provider value={{ ready, mode: "clientside", capabilities }}>
      {!ready ? (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 text-sm text-zinc-500">
          Starting clientside runtime…
        </div>
      ) : (
        children
      )}
    </ClientsideContext.Provider>
  );
}

// Re-export for tests that import store after init
export { store };
