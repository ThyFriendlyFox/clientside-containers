"use client";

import { useEffect } from "react";
import { getBottledApp, type Container } from "@/lib/container";

export function WebBottle({ container, onStatus }: { container: Container; onStatus?: (s: Container["status"]) => void }) {
  const app = getBottledApp(container.appId);

  useEffect(() => {
    onStatus?.("running");
  }, [onStatus]);

  if (!app.url) {
    return (
      <div className="flex h-full items-center justify-center bg-ink-950 text-sm text-zinc-500">
        No web app URL configured for {app.label}.
      </div>
    );
  }

  return (
    <iframe
      title={`${app.label} — ${container.name}`}
      src={app.url}
      className="h-full w-full border-0 bg-black"
      allow="autoplay; fullscreen; gamepad; clipboard-write"
    />
  );
}
