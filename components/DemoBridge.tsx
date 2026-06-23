"use client";

import { useEffect } from "react";

// In the static GitHub Pages demo (NEXT_PUBLIC_DEMO=true) there is no server, so
// we intercept calls to /api/* and serve them from the in-browser simulation.
const DEMO = process.env.NEXT_PUBLIC_DEMO === "true";

type FetchFn = typeof fetch;

interface PatchFlag {
  __nemoclawFetchPatched?: boolean;
}

function installShim(): void {
  if (typeof window === "undefined") return;
  const flag = window as unknown as PatchFlag;
  if (flag.__nemoclawFetchPatched) return;
  flag.__nemoclawFetchPatched = true;

  const original: FetchFn = window.fetch.bind(window);

  const patched: FetchFn = async (input, init) => {
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
        const { handleDemoRequest } = await import("@/lib/demo-backend");
        return handleDemoRequest(apiPath, u.searchParams, method, forwardInit);
      }
    } catch {
      // Fall through to the real fetch on any parsing error.
    }
    return original(input, init);
  };

  window.fetch = patched;
}

if (DEMO) installShim();

export function DemoBridge() {
  useEffect(() => {
    if (DEMO) installShim();
  }, []);
  return null;
}
