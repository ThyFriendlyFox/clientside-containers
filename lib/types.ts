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
  settings: ContainerSettings;
}

// --- Container settings (shared by sandboxes & environments) ---------------

export type RuntimeMode = "headless" | "minios";

export type NetworkEgress = "minimal" | "restricted" | "custom";

export type SafetyProfile = "strict" | "balanced" | "permissive";

export interface ContainerSettings {
  runtimeMode: RuntimeMode;
  /** OS base used when runtimeMode is minios (ubuntu-desktop, fedora-desktop, windows, …). */
  miniosBaseId: string;
  networkEgress: NetworkEgress;
  safetyProfile: SafetyProfile;
  allowInferenceRouting: boolean;
}

export type ContainerKind = "sandbox" | "environment";

/** Unified view for the running-containers grid. */
export interface ContainerView {
  id: string;
  kind: ContainerKind;
  name: string;
  status: SandboxStatus;
  driver: ComputeDriver;
  createdAt: string;
  settings: ContainerSettings;
  policyYaml: string;
  /** Short subtitle (agent name, app list, template, …). */
  subtitle: string;
  /** Desktop URL when minios mode and base exposes a GUI. */
  desktopUrl: string | null;
  detailHref: string;
}

// --- Environments: the heavier, OS-flavored tier ---------------------------

export type DesktopAccess = "kasmvnc" | "novnc" | "web-viewer" | "none";

export type OsFamily = "desktop" | "mobile";

export interface OsBase {
  id: string;
  label: string;
  family: OsFamily;
  image: string;
  desktop: DesktopAccess;
  guiPort: number;
  note: string;
  // Whether this base actually runs in a Linux container. iOS does not.
  containerized?: boolean;
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
  settings: ContainerSettings;
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
