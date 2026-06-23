import yaml from "js-yaml";
import type { Environment } from "./types";
import { desktopAppsIn } from "./desktop-apps";
import { getBase } from "./environments";

// Generates a docker-compose project for an environment. The compose file is
// what the export bundle and the desktop companion app run locally.

interface ComposeService {
  image: string;
  container_name?: string;
  restart?: string;
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  devices?: string[];
  cap_add?: string[];
  cap_drop?: string[];
  privileged?: boolean;
  shm_size?: string;
  stop_grace_period?: string;
  depends_on?: string[];
  networks?: string[];
  cpus?: number;
  mem_limit?: string;
  command?: string;
}

export interface ComposeProject {
  name: string;
  services: Record<string, ComposeService>;
  networks: Record<string, { driver: string }>;
  volumes: Record<string, Record<string, never>>;
}

const NETWORK = "envnet";

/** Install desktop programs into a webtop bottle via linuxserver mods + init scripts. */
function applyDesktopPrograms(desktop: ComposeService, env: Environment): void {
  const apps = desktopAppsIn(env.apps);
  if (apps.length === 0) return;

  const pkgs = [...new Set(apps.flatMap((a) => a.packages))];
  const envVars = { ...(desktop.environment ?? {}) };
  const mods = envVars.DOCKER_MODS;
  envVars.DOCKER_MODS = mods
    ? `${mods}|linuxserver/mods:universal-package-install`
    : "linuxserver/mods:universal-package-install";
  const existing = envVars.INSTALL_PACKAGES;
  envVars.INSTALL_PACKAGES = existing ? `${existing}|${pkgs.join("|")}` : pkgs.join("|");
  desktop.environment = envVars;

  // Init scripts in bottle-init/ register autostart entries inside the persistent bottle.
  const vols = desktop.volumes ?? ["desktop_data:/config"];
  if (!vols.includes("./bottle-init:/config/custom-cont-init.d:ro")) {
    vols.push("./bottle-init:/config/custom-cont-init.d:ro");
  }
  desktop.volumes = vols;
}

export function buildComposeProject(env: Environment): ComposeProject {
  const base = getBase(env.baseId);
  const services: Record<string, ComposeService> = {};
  const volumes: Record<string, Record<string, never>> = {};

  const cpus = env.resources.cpus;
  const mem = `${env.resources.memoryMb}m`;

  const hasAppium = env.apps.includes("appium");

  if (base.family === "mobile") {
    if (base.id === "android-emulator") {
      // budtmo/docker-android: noVNC web view (6080), ADB (5555), built-in Appium (4723).
      services.device = {
        image: base.image,
        container_name: "android",
        restart: "unless-stopped",
        privileged: true,
        devices: ["/dev/kvm"],
        ports: ["6080:6080", "5555:5555", "4723:4723"],
        networks: [NETWORK],
        environment: {
          EMULATOR_DEVICE: "Samsung Galaxy S10",
          WEB_VNC: "true",
          APPIUM: hasAppium ? "true" : "false",
          EMULATOR_ADDITIONAL_ARGS: "-no-snapshot-save",
        },
        cpus,
        mem_limit: mem,
      };
    } else if (base.id === "android-redroid") {
      // redroid runs Android directly via the host kernel; ADB on 5555.
      services.device = {
        image: base.image,
        container_name: "android",
        restart: "unless-stopped",
        privileged: true,
        ports: ["5555:5555"],
        networks: [NETWORK],
        volumes: ["android_data:/data"],
        command:
          "androidboot.redroid_width=1080 androidboot.redroid_height=2340 androidboot.redroid_dpi=440 " +
          "androidboot.redroid_gpu_mode=guest",
        cpus,
        mem_limit: mem,
      };
      volumes.android_data = {};
    }
    // ios-external has no device container — it targets a macOS host over Appium.
  } else if (base.desktop !== "none") {
    const desktop: ComposeService = {
      image: base.image,
      container_name: "desktop",
      restart: "unless-stopped",
      ports: [`${base.guiPort}:${base.guiPort}`],
      networks: [NETWORK],
      cpus,
      mem_limit: mem,
      volumes: ["desktop_data:/config"],
    };
    if (base.id === "windows") {
      desktop.environment = {
        VERSION: "11",
        RAM_SIZE: mem,
        CPU_CORES: String(cpus),
        DISK_SIZE: `${env.resources.diskGb}G`,
      };
      desktop.devices = ["/dev/kvm", "/dev/net/tun"];
      desktop.cap_add = ["NET_ADMIN"];
      desktop.stop_grace_period = "2m";
    } else {
      desktop.environment = { PUID: "1000", PGID: "1000", TZ: "Etc/UTC" };
      desktop.shm_size = "1gb";
    }
    services.desktop = desktop;
    volumes.desktop_data = {};
    applyDesktopPrograms(desktop, env);
  }

  const hasChrome = env.apps.includes("chrome");
  const hasPlaywright = env.apps.includes("playwright");
  const hasN8n = env.apps.includes("n8n");

  if (hasChrome) {
    services.chrome = {
      image: "ghcr.io/browserless/chromium:latest",
      container_name: "chrome",
      restart: "unless-stopped",
      networks: [NETWORK],
      shm_size: "2gb",
      environment: {
        CONCURRENT: "5",
        TOKEN: "envtoken",
      },
      ports: ["3000:3000"],
      cpus,
      mem_limit: mem,
    };
  }

  if (hasN8n) {
    const n8nEnv: Record<string, string> = {
      N8N_PORT: "5678",
      N8N_SECURE_COOKIE: "false",
      GENERIC_TIMEZONE: "Etc/UTC",
      NODE_FUNCTION_ALLOW_EXTERNAL: "playwright,playwright-core",
    };
    if (hasChrome) {
      // n8n's Playwright/Code nodes connect to Chrome over CDP "naturally".
      n8nEnv.PLAYWRIGHT_CHROMIUM_WS = "ws://chrome:3000?token=envtoken";
      n8nEnv.CHROME_CDP_URL = "http://chrome:3000?token=envtoken";
    }
    services.n8n = {
      image: "docker.n8n.io/n8nio/n8n:latest",
      container_name: "n8n",
      restart: "unless-stopped",
      networks: [NETWORK],
      ports: ["5678:5678"],
      environment: n8nEnv,
      volumes: ["n8n_data:/home/node/.n8n"],
      depends_on: hasChrome ? ["chrome"] : undefined,
      cpus,
      mem_limit: mem,
    };
    volumes.n8n_data = {};
  }

  if (hasPlaywright && !hasN8n) {
    services.playwright = {
      image: "mcr.microsoft.com/playwright:v1.49.0-noble",
      container_name: "playwright",
      restart: "unless-stopped",
      networks: [NETWORK],
      command: 'sleep infinity',
      environment: hasChrome ? { CHROME_CDP_URL: "http://chrome:3000?token=envtoken" } : undefined,
      depends_on: hasChrome ? ["chrome"] : undefined,
      cpus,
      mem_limit: mem,
    };
  }

  if (env.apps.includes("vscode")) {
    services.vscode = {
      image: "lscr.io/linuxserver/code-server:latest",
      container_name: "vscode",
      restart: "unless-stopped",
      networks: [NETWORK],
      ports: ["8443:8443"],
      environment: { PUID: "1000", PGID: "1000", TZ: "Etc/UTC" },
      volumes: ["vscode_config:/config"],
      cpus,
      mem_limit: mem,
    };
    volumes.vscode_config = {};
  }

  if (env.apps.includes("postgres")) {
    services.postgres = {
      image: "postgres:16",
      container_name: "postgres",
      restart: "unless-stopped",
      networks: [NETWORK],
      environment: { POSTGRES_PASSWORD: "envpass", POSTGRES_DB: "app" },
      volumes: ["pg_data:/var/lib/postgresql/data"],
      cpus,
      mem_limit: mem,
    };
    volumes.pg_data = {};
  }

  // Browser-based Android screen view (ws-scrcpy), attaches to the device over ADB.
  if (env.apps.includes("scrcpy-web") && base.family === "mobile" && base.id !== "ios-external") {
    services["scrcpy-web"] = {
      image: "ethanzhu/ws-scrcpy:latest",
      container_name: "scrcpy-web",
      restart: "unless-stopped",
      networks: [NETWORK],
      ports: ["8000:8000"],
      depends_on: ["device"],
      cpus,
      mem_limit: mem,
    };
  }

  // Standalone Appium server. The Android emulator base bundles Appium already,
  // so only add a separate server for redroid and the external iOS runner.
  if (hasAppium && base.id !== "android-emulator") {
    const appiumEnv: Record<string, string> = {};
    if (base.id === "android-redroid") {
      // Point Appium's ADB at the redroid device container.
      appiumEnv.ANDROID_ADB_SERVER_ADDRESS = "device";
      appiumEnv.ANDROID_ADB_SERVER_PORT = "5555";
    } else if (base.id === "ios-external") {
      // iOS runs on a macOS host; forward to its WebDriverAgent/Appium endpoint.
      appiumEnv.IOS_APPIUM_URL = "http://CHANGE-ME-macos-host.local:4723";
    }
    services.appium = {
      image: "appium/appium:latest",
      container_name: "appium",
      restart: "unless-stopped",
      networks: [NETWORK],
      ports: ["4723:4723"],
      environment: Object.keys(appiumEnv).length ? appiumEnv : undefined,
      depends_on: base.id === "android-redroid" ? ["device"] : undefined,
      command: "appium --base-path /wd/hub --allow-insecure chromedriver_autodownload",
      cpus,
      mem_limit: mem,
    };
  }

  // Strip undefined keys for clean YAML.
  for (const svc of Object.values(services)) {
    for (const k of Object.keys(svc) as (keyof ComposeService)[]) {
      if (svc[k] === undefined) delete svc[k];
    }
  }

  return {
    name: `csc-${env.name}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase(),
    services,
    networks: { [NETWORK]: { driver: "bridge" } },
    volumes,
  };
}

export function composeToYaml(env: Environment): string {
  const project = buildComposeProject(env);
  const header =
    `# docker-compose for NemoClaw environment "${env.name}" (${env.id}).\n` +
    `# Generated by clientside-containers. Run with: docker compose up -d\n\n`;
  // compose `name` is a top-level key; services/networks/volumes follow.
  const doc = {
    name: project.name,
    services: project.services,
    networks: project.networks,
    volumes: project.volumes,
  };
  return header + yaml.dump(doc, { lineWidth: 120, noRefs: true, sortKeys: false });
}

// Returns the user-facing endpoints exposed by an environment.
export function environmentEndpoints(env: Environment): { label: string; url: string }[] {
  const base = getBase(env.baseId);
  const endpoints: { label: string; url: string }[] = [];

  if (base.family === "mobile") {
    if (base.id === "android-emulator") {
      endpoints.push({ label: "Android screen (web)", url: "http://localhost:6080" });
      endpoints.push({ label: "ADB", url: "adb connect localhost:5555" });
    }
    if (base.id === "android-redroid") {
      endpoints.push({ label: "ADB", url: "adb connect localhost:5555" });
    }
    if (env.apps.includes("scrcpy-web")) endpoints.push({ label: "scrcpy (web)", url: "http://localhost:8000" });
    if (env.apps.includes("appium")) endpoints.push({ label: "Appium", url: "http://localhost:4723" });
    return endpoints;
  }

  if (base.desktop !== "none") {
    endpoints.push({ label: "Desktop bottle", url: `http://localhost:${base.guiPort}` });
    for (const app of desktopAppsIn(env.apps)) {
      endpoints.push({
        label: app.label,
        url: app.autostart ? `autostarts on the desktop` : `launch from the desktop menu`,
      });
    }
  }
  if (env.apps.includes("n8n")) endpoints.push({ label: "n8n editor", url: "http://localhost:5678" });
  if (env.apps.includes("chrome")) endpoints.push({ label: "Chrome CDP", url: "ws://localhost:3000" });
  if (env.apps.includes("vscode")) endpoints.push({ label: "VS Code", url: "http://localhost:8443" });
  return endpoints;
}
