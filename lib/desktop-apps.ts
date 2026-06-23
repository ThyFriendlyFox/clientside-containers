// Programs installed into a desktop "bottle" (mini OS inside the container).
// These are not separate services — they run on the streamed desktop (KasmVNC / webtop).

export interface DesktopApp {
  id: string;
  label: string;
  /** Native packages installed via linuxserver universal-package-install. */
  packages: string[];
  /** Command to launch the app on the desktop. */
  exec: string;
  /** If true, drop a .desktop file into autostart so the app opens when the bottle boots. */
  autostart: boolean;
}

export const DESKTOP_APPS: Record<string, DesktopApp> = {
  openttd: {
    id: "openttd",
    label: "OpenTTD",
    packages: ["openttd"],
    exec: "openttd",
    autostart: true,
  },
  firefox: {
    id: "firefox",
    label: "Firefox",
    packages: ["firefox"],
    exec: "firefox",
    autostart: false,
  },
};

export function desktopAppsIn(envApps: string[]): DesktopApp[] {
  return envApps.map((id) => DESKTOP_APPS[id]).filter(Boolean);
}

export function hasDesktopApps(envApps: string[]): boolean {
  return desktopAppsIn(envApps).length > 0;
}
