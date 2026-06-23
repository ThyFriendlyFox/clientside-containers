import type { Environment, LogEntry, Sandbox, Provider } from "./types";

// Process-wide in-memory store. Persisted on globalThis so it survives
// Next.js dev hot-reloads within a single server process.
interface StoreState {
  sandboxes: Map<string, Sandbox>;
  environments: Map<string, Environment>;
  providers: Map<string, Provider>;
  seeded: boolean;
}

const globalForStore = globalThis as unknown as { __nemoclawStore?: StoreState };

export const store: StoreState =
  globalForStore.__nemoclawStore ??
  (globalForStore.__nemoclawStore = {
    sandboxes: new Map(),
    environments: new Map(),
    providers: new Map(),
    seeded: false,
  });

export function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${rand}`;
}

export function appendLog(target: { logs: LogEntry[] }, level: LogEntry["level"], message: string): void {
  target.logs.push({ ts: new Date().toISOString(), level, message });
  if (target.logs.length > 200) target.logs.shift();
}
