// Domain types modeling the NemoClaw + OpenShell stack.
// References:
//   https://github.com/NVIDIA/NemoClaw
//   https://github.com/NVIDIA/OpenShell

export type AgentKind = "openclaw" | "hermes" | "langchain-deepagents-code";

export const AGENTS: Record<AgentKind, { label: string; vendor: string; docs: string }> = {
  openclaw: {
    label: "OpenClaw",
    vendor: "openclaw.ai",
    docs: "https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart.html",
  },
  hermes: {
    label: "Hermes",
    vendor: "get-hermes.ai",
    docs: "https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart-hermes.html",
  },
  "langchain-deepagents-code": {
    label: "LangChain Deep Agents Code",
    vendor: "langchain.com",
    docs: "https://docs.nvidia.com/nemoclaw/latest/get-started/quickstart-langchain-deepagents-code.html",
  },
};

export type ComputeDriver = "docker" | "podman" | "microvm" | "kubernetes";

export const DRIVERS: ComputeDriver[] = ["docker", "podman", "microvm", "kubernetes"];

export type SandboxStatus = "provisioning" | "running" | "stopped" | "error";

export type LogLevel = "info" | "allow" | "route" | "deny";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  message: string;
}

export interface Provider {
  id: string;
  name: string;
  kind: string;
  keyHint: string;
  createdAt: string;
}

export interface Sandbox {
  id: string;
  name: string;
  agent: AgentKind;
  driver: ComputeDriver;
  status: SandboxStatus;
  provider: string | null;
  createdAt: string;
  policyYaml: string;
  logs: LogEntry[];
}

// --- Environments: the heavier, OS-flavored tier ---------------------------

export type DesktopAccess = "kasmvnc" | "novnc" | "web-viewer" | "none";

export interface OsBase {
  id: string;
  label: string;
  image: string;
  desktop: DesktopAccess;
  guiPort: number;
  note: string;
}

export interface AppSpec {
  id: string;
  label: string;
  // Long-lived service (own container) vs an app installed into the desktop base.
  kind: "service" | "desktop-app";
  category: string;
}

export interface EnvResources {
  cpus: number;
  memoryMb: number;
  diskGb: number;
}

export interface Environment {
  id: string;
  name: string;
  templateId: string | null;
  baseId: string;
  apps: string[];
  resources: EnvResources;
  driver: ComputeDriver;
  status: SandboxStatus;
  policyYaml: string;
  autostart: boolean;
  createdAt: string;
  logs: LogEntry[];
}

export type Verdict = "allow" | "route" | "deny";

export interface EgressRequest {
  binary: string;
  host: string;
  port: number;
  method: string;
}

export interface EgressResult {
  verdict: Verdict;
  detail: string;
  matchedBlock?: string;
}
