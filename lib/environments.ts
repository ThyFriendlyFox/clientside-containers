import type { AppSpec, EnvResources, OsBase } from "./types";

// OS-flavored bases — the "heavier" option, much like Bottles' full environments.
// Each base provides a GUI desktop reachable in the browser or a desktop viewer.
export const OS_BASES: OsBase[] = [
  {
    id: "windows",
    label: "Windows (KVM)",
    // Runs a real Windows install inside a container via KVM, with a web viewer.
    image: "dockurr/windows:latest",
    desktop: "web-viewer",
    guiPort: 8006,
    note: "Full Windows desktop in KVM. Requires /dev/kvm on the host.",
  },
  {
    id: "ubuntu-desktop",
    label: "Ubuntu Desktop (KasmVNC)",
    image: "lscr.io/linuxserver/webtop:ubuntu-xfce",
    desktop: "kasmvnc",
    guiPort: 3000,
    note: "XFCE desktop streamed over KasmVNC. Runs on any Docker host.",
  },
  {
    id: "fedora-desktop",
    label: "Fedora Desktop (KasmVNC)",
    image: "lscr.io/linuxserver/webtop:fedora-xfce",
    desktop: "kasmvnc",
    guiPort: 3000,
    note: "XFCE desktop streamed over KasmVNC.",
  },
  {
    id: "headless",
    label: "Headless (no desktop)",
    image: "debian:stable-slim",
    desktop: "none",
    guiPort: 0,
    note: "Minimal base with no GUI — services only.",
  },
];

// Catalog of apps/services that can be composed into an environment.
export const APP_CATALOG: AppSpec[] = [
  { id: "chrome", label: "Chrome (CDP endpoint)", kind: "service", category: "browser" },
  { id: "n8n", label: "n8n", kind: "service", category: "automation" },
  { id: "playwright", label: "Playwright runtime", kind: "service", category: "automation" },
  { id: "vscode", label: "VS Code (code-server)", kind: "service", category: "dev" },
  { id: "postgres", label: "PostgreSQL", kind: "service", category: "data" },
  { id: "firefox", label: "Firefox", kind: "desktop-app", category: "browser" },
];

export interface EnvTemplate {
  id: string;
  label: string;
  description: string;
  baseId: string;
  apps: string[];
  resources: EnvResources;
  presetId: string | null;
  wiring: string;
}

export const ENV_TEMPLATES: EnvTemplate[] = [
  {
    id: "windows-n8n-chrome",
    label: "Windows + Chrome + n8n",
    description:
      "A Windows desktop alongside an n8n automation service and a Chrome CDP endpoint. n8n workflows drive Chrome through Playwright.",
    baseId: "windows",
    apps: ["n8n", "chrome", "playwright"],
    resources: { cpus: 4, memoryMb: 8192, diskGb: 64 },
    presetId: "github-readonly",
    wiring:
      "n8n connects to the Chrome service over the internal network via the CDP websocket (PLAYWRIGHT_CHROMIUM_WS). Workflows launch Playwright against that endpoint to control the browser.",
  },
  {
    id: "ubuntu-automation",
    label: "Ubuntu Desktop + Chrome + n8n",
    description:
      "An Ubuntu XFCE desktop with n8n and a Chrome CDP endpoint, wired for Playwright-driven browser automation.",
    baseId: "ubuntu-desktop",
    apps: ["n8n", "chrome", "playwright"],
    resources: { cpus: 2, memoryMb: 4096, diskGb: 32 },
    presetId: "npm-registry",
    wiring:
      "n8n reaches the Chrome service through the internal Docker network. Playwright connects over CDP to automate page interactions.",
  },
  {
    id: "headless-automation",
    label: "Headless automation (n8n + Chrome)",
    description:
      "No desktop — just n8n and a Chrome CDP endpoint for lightweight, server-side browser automation.",
    baseId: "headless",
    apps: ["n8n", "chrome", "playwright"],
    resources: { cpus: 2, memoryMb: 2048, diskGb: 16 },
    presetId: null,
    wiring:
      "n8n drives the Chrome CDP endpoint via Playwright over the internal network. No GUI is exposed.",
  },
  {
    id: "dev-desktop",
    label: "Dev desktop (VS Code + Chrome)",
    description: "An Ubuntu desktop with code-server and a Chrome CDP endpoint for development and testing.",
    baseId: "ubuntu-desktop",
    apps: ["vscode", "chrome"],
    resources: { cpus: 2, memoryMb: 4096, diskGb: 32 },
    presetId: "github-readonly",
    wiring: "code-server runs alongside the desktop; Chrome exposes a CDP endpoint for automated testing.",
  },
];

export const DEFAULT_RESOURCES: EnvResources = { cpus: 2, memoryMb: 4096, diskGb: 32 };

export function getBase(baseId: string): OsBase {
  return OS_BASES.find((b) => b.id === baseId) ?? OS_BASES[OS_BASES.length - 1];
}

export function getTemplate(id: string | null | undefined): EnvTemplate | null {
  if (!id) return null;
  return ENV_TEMPLATES.find((t) => t.id === id) ?? null;
}
