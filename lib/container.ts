// The whole app is containers. Three tiers, all real and running in the browser:
//   headless  — a JS runtime in a Web Worker that answers API calls
//   app       — a "bottle": one program in a minified Linux, shown as a single app
//   minios    — a full minified Linux (x86 via v86/WASM) with a shell and tools

export type ContainerTier = "headless" | "app" | "minios";

export type ContainerStatus = "stopped" | "booting" | "running" | "error";

export interface ContainerSettings {
  /** Guest RAM in MiB (minios/app tiers). */
  memoryMb: number;
  /** Outbound networking posture. */
  network: "off" | "restricted" | "open";
  /** Start automatically when the dashboard loads. */
  autostart: boolean;
}

export interface Container {
  id: string;
  name: string;
  tier: ContainerTier;
  /** For the `app` tier: which bottled program to launch. */
  appId?: string;
  status: ContainerStatus;
  createdAt: string;
  settings: ContainerSettings;
}

export const TIERS: Record<
  ContainerTier,
  { label: string; blurb: string; defaultMemoryMb: number; icon: string }
> = {
  headless: {
    label: "Headless",
    blurb: "A JS runtime in a Web Worker that answers API calls. No display.",
    defaultMemoryMb: 64,
    icon: "M5 7h14M5 12h14M5 17h10",
  },
  app: {
    label: "App bottle",
    blurb: "A single program running inside a minified Linux.",
    defaultMemoryMb: 192,
    icon: "M4 4h16v6H4zM4 14h16v6H4z",
  },
  minios: {
    label: "Mini OS",
    blurb: "A full minified Linux booted in your browser (x86 via WASM).",
    defaultMemoryMb: 256,
    icon: "M3 5h18v12H3zM8 21h8M12 17v4",
  },
};

/** Programs available to the `app` (bottle) tier. Each runs in the minified Linux. */
export interface BottledApp {
  id: string;
  label: string;
  /** Shell command run on boot inside the guest. */
  command: string;
  blurb: string;
}

export const BOTTLED_APPS: BottledApp[] = [
  {
    id: "shell",
    label: "BusyBox shell",
    command: "/bin/sh",
    blurb: "An interactive POSIX shell.",
  },
  {
    id: "lua",
    label: "Lua REPL",
    command: "lua",
    blurb: "Interactive Lua interpreter.",
  },
  {
    id: "vi",
    label: "vi editor",
    command: "vi",
    blurb: "The vi text editor.",
  },
  {
    id: "top",
    label: "Process monitor",
    command: "top",
    blurb: "Live view of guest processes.",
  },
];

export function getBottledApp(id: string | undefined): BottledApp {
  return BOTTLED_APPS.find((a) => a.id === id) ?? BOTTLED_APPS[0];
}

export const DEFAULT_SETTINGS: Record<ContainerTier, ContainerSettings> = {
  headless: { memoryMb: 64, network: "restricted", autostart: false },
  app: { memoryMb: 192, network: "restricted", autostart: false },
  minios: { memoryMb: 256, network: "restricted", autostart: false },
};

export function newId(prefix = "ctr"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function tierUsesEmulator(tier: ContainerTier): boolean {
  return tier === "app" || tier === "minios";
}
