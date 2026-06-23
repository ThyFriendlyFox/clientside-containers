"use client";

import { useEffect } from "react";
import { TIERS, tierUsesEmulator, type Container } from "@/lib/container";
import { EmulatorScreen } from "./runtime/EmulatorScreen";
import { AgentConsole } from "./runtime/AgentConsole";

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
        {tierUsesEmulator(container.tier) ? (
          <EmulatorScreen container={container} onStatus={onStatus} />
        ) : (
          <AgentConsole container={container} onStatus={onStatus} />
        )}
      </div>
      <footer className="border-t border-ink-700 bg-ink-900 px-4 py-1.5 text-center text-xs text-zinc-500">
        {tierUsesEmulator(container.tier)
          ? "Real x86 Linux running in this tab via WebAssembly. Click the screen, then type."
          : "OpenShell-style agent runtime in a Web Worker — API calls and policy egress decisions in this tab."}
      </footer>
    </div>
  );
}
