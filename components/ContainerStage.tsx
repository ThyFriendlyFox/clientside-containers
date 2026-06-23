"use client";

import { useEffect } from "react";
import { TIERS, getBottledApp, type Container } from "@/lib/container";
import { EmulatorScreen } from "./runtime/EmulatorScreen";
import { AgentConsole } from "./runtime/AgentConsole";
import { WebBottle } from "./runtime/WebBottle";

function runtimeKind(container: Container): "agent" | "web" | "emulator" {
  if (container.tier === "agent") return "agent";
  if (container.tier === "app" && getBottledApp(container.appId).runtime === "web") return "web";
  return "emulator";
}

interface Props {
  container: Container;
  onClose: () => void;
  onStatus: (status: Container["status"]) => void;
}

export function ContainerStage({ container, onClose, onStatus }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500"
              aria-label="Close"
            />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
            <span className="h-3 w-3 rounded-full bg-zinc-600" />
          </div>
          <span className="text-sm font-medium text-white">{container.name}</span>
          <span className="badge border-ink-600 text-zinc-400">{TIERS[container.tier].label}</span>
        </div>
        <button type="button" onClick={onClose} className="btn-ghost px-3 py-1 text-xs">
          Close
        </button>
      </header>
      <div className="flex-1 overflow-hidden">
        {(() => {
          const kind = runtimeKind(container);
          if (kind === "agent") return <AgentConsole container={container} onStatus={onStatus} />;
          if (kind === "web") return <WebBottle container={container} onStatus={onStatus} />;
          return <EmulatorScreen container={container} onStatus={onStatus} />;
        })()}
      </div>
      <footer className="border-t border-ink-700 bg-ink-900 px-4 py-1.5 text-center text-xs text-zinc-500">
        {runtimeKind(container) === "agent"
          ? "OpenShell-style agent runtime in a Web Worker — API calls and policy egress decisions in this tab."
          : runtimeKind(container) === "web"
            ? "WebAssembly app running in this tab."
            : "Real x86 OS running in this tab via WebAssembly. Click the screen, then type."}
      </footer>
    </div>
  );
}
