import yaml from "js-yaml";
import type { Environment } from "./types";
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

export function buildComposeProject(env: Environment): ComposeProject {
  const base = getBase(env.baseId);
  const services: Record<string, ComposeService> = {};
  const volumes: Record<string, Record<string, never>> = {};

  const cpus = env.resources.cpus;
  const mem = `${env.resources.memoryMb}m`;

  if (base.desktop !== "none") {
    const desktop: ComposeService = {
      image: base.image,
      container_name: "desktop",
      restart: "unless-stopped",
      ports: [`${base.guiPort}:${base.guiPort}`],
      networks: [NETWORK],
      cpus,
      mem_limit: mem,
      volumes: ["desktop_data:/storage"],
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

  // Strip undefined keys for clean YAML.
  for (const svc of Object.values(services)) {
    for (const k of Object.keys(svc) as (keyof ComposeService)[]) {
      if (svc[k] === undefined) delete svc[k];
    }
  }

  return {
    name: `nemoclaw-${env.name}`.replace(/[^a-z0-9_-]/gi, "-").toLowerCase(),
    services,
    networks: { [NETWORK]: { driver: "bridge" } },
    volumes,
  };
}

export function composeToYaml(env: Environment): string {
  const project = buildComposeProject(env);
  const header =
    `# docker-compose for NemoClaw environment "${env.name}" (${env.id}).\n` +
    `# Generated by NemoClaw Console. Run with: docker compose up -d\n\n`;
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
  if (base.desktop !== "none") {
    endpoints.push({ label: `${base.label} desktop`, url: `http://localhost:${base.guiPort}` });
  }
  if (env.apps.includes("n8n")) endpoints.push({ label: "n8n editor", url: "http://localhost:5678" });
  if (env.apps.includes("chrome")) endpoints.push({ label: "Chrome CDP", url: "ws://localhost:3000" });
  if (env.apps.includes("vscode")) endpoints.push({ label: "VS Code", url: "http://localhost:8443" });
  return endpoints;
}
