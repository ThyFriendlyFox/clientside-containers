import JSZip from "jszip";
import type { Environment } from "./types";
import { desktopAppsIn } from "./desktop-apps";
import { composeToYaml, environmentEndpoints } from "./compose";
import { getBase, getTemplate } from "./environments";

export interface BundleFile {
  path: string;
  content: string;
  executable?: boolean;
}

export function envSlug(env: Environment): string {
  return (env.name || env.id).replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
}

function startSh(slug: string): string {
  return `#!/usr/bin/env bash
# Start the "${slug}" environment.
set -euo pipefail
cd "$(dirname "$0")"
docker compose up -d
echo "Environment '${slug}' started."
`;
}

function stopSh(slug: string): string {
  return `#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
docker compose down
`;
}

function startPs1(slug: string): string {
  return `# Start the "${slug}" environment.
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
docker compose up -d
Write-Host "Environment '${slug}' started."
`;
}

function systemdUnit(slug: string): string {
  return `[Unit]
Description=NemoClaw environment ${slug}
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=%h/nemoclaw-${slug}
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down

[Install]
WantedBy=default.target
`;
}

function launchdPlist(slug: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.nemoclaw.${slug}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd "$HOME/nemoclaw-${slug}" &amp;&amp; /usr/local/bin/docker compose up -d</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
`;
}

function windowsAutostartPs1(slug: string): string {
  return `# Register "${slug}" to start at logon via Task Scheduler.
$ErrorActionPreference = "Stop"
$dir = $PSScriptRoot
$action = New-ScheduledTaskAction -Execute "powershell.exe" \`
  -Argument "-NoProfile -WindowStyle Hidden -File \`"$dir\\start.ps1\`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "NemoClaw-${slug}" -Action $action -Trigger $trigger \`
  -Settings $settings -Description "Start NemoClaw environment ${slug} at logon" -Force
Write-Host "Autostart registered. Remove with: Unregister-ScheduledTask -TaskName 'NemoClaw-${slug}'"
`;
}

function readme(env: Environment, slug: string): string {
  const base = getBase(env.baseId);
  const tmpl = getTemplate(env.templateId);
  const endpoints = environmentEndpoints(env);
  const endpointLines = endpoints.map((e) => `- **${e.label}** — ${e.url}`).join("\n");

  return `# NemoClaw environment: ${env.name}

Exported from NemoClaw Console. This bundle runs the environment on your own
host with Docker, and can start automatically on boot.

- **Base:** ${base.label} (\`${base.image}\`)
- **Apps:** ${env.apps.join(", ") || "none"}
- **Resources:** ${env.resources.cpus} vCPU · ${env.resources.memoryMb} MB RAM · ${env.resources.diskGb} GB disk
${tmpl ? `- **Template:** ${tmpl.label}\n- **Wiring:** ${tmpl.wiring}` : ""}

## Prerequisites

- Docker Engine with the Compose plugin (\`docker compose\`).
${base.id === "windows" ? "- A host with `/dev/kvm` available (Linux with KVM) for the Windows base.\n" : ""}${base.id === "android-emulator" ? "- A host with `/dev/kvm` for usable Android emulator speed.\n- View the device at http://localhost:6080. Appium (if enabled) is on http://localhost:4723.\n" : ""}${base.id === "android-redroid" ? "- The host kernel must provide the `binder_linux` and `ashmem_linux` modules (load with `sudo modprobe binder_linux devices=binder,hwbinder,vndbinder` and `sudo modprobe ashmem_linux`).\n- Connect with `adb connect localhost:5555`. If `scrcpy-web` is enabled, open http://localhost:8000.\n" : ""}${base.id === "ios-external" ? "- iOS cannot run in a Linux container. Provide a reachable macOS host with Xcode and Appium/WebDriverAgent, then set `IOS_APPIUM_URL` in the appium service to that host.\n" : ""}

## Run

\`\`\`bash
# Linux / macOS
./start.sh

# Windows (PowerShell)
./start.ps1
\`\`\`

Stop with \`./stop.sh\` (or \`docker compose down\`).

## Endpoints

${endpointLines || "_No exposed endpoints._"}

## Start on boot

| Host | Steps |
| --- | --- |
| **Linux (systemd)** | Copy this folder to \`~/nemoclaw-${slug}\`, then \`mkdir -p ~/.config/systemd/user && cp autostart/nemoclaw-${slug}.service ~/.config/systemd/user/ && systemctl --user enable --now nemoclaw-${slug} && loginctl enable-linger $USER\` |
| **macOS (launchd)** | Copy this folder to \`~/nemoclaw-${slug}\`, then \`cp autostart/com.nemoclaw.${slug}.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.nemoclaw.${slug}.plist\` |
| **Windows (Task Scheduler)** | Run \`autostart/Install-Autostart.ps1\` in an elevated PowerShell. |

> Or install the **NemoClaw Desktop** companion app, drop this bundle into it,
> and toggle "Start on boot" — it manages the steps above for you.

## OpenShell policy

\`openshell-policy.yaml\` is the network/inference policy for this environment.
Apply it to a running OpenShell sandbox with:

\`\`\`bash
openshell policy set ${slug} --policy openshell-policy.yaml --wait
\`\`\`
`;
}

function bottleInitFiles(env: Environment): BundleFile[] {
  const apps = desktopAppsIn(env.apps);
  if (apps.length === 0) return [];

  const lines = [
    "#!/usr/bin/with-contenv bash",
    "# Register desktop programs inside this bottle (linuxserver/webtop custom-cont-init.d).",
    "set -e",
    "mkdir -p /config/.config/autostart",
    "",
  ];

  for (const app of apps) {
    if (app.autostart) {
      lines.push(
        `cat > /config/.config/autostart/${app.id}.desktop << 'EOF'`,
        "[Desktop Entry]",
        "Type=Application",
        `Name=${app.label}`,
        `Exec=${app.exec}`,
        "X-GNOME-Autostart-enabled=true",
        "EOF",
        "",
      );
    }
  }

  return [
    {
      path: "bottle-init/99-programs.sh",
      content: lines.join("\n"),
      executable: true,
    },
  ];
}

function manifest(env: Environment, slug: string): string {
  return JSON.stringify(
    {
      name: env.name,
      slug,
      sourceId: env.id,
      baseId: env.baseId,
      apps: env.apps,
      resources: env.resources,
      autostart: env.autostart,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

export function buildBundle(env: Environment): BundleFile[] {
  const slug = envSlug(env);
  return [
    { path: "docker-compose.yml", content: composeToYaml(env) },
    { path: "openshell-policy.yaml", content: env.policyYaml },
    { path: "nemoclaw-env.json", content: manifest(env, slug) },
    { path: "README.md", content: readme(env, slug) },
    { path: "start.sh", content: startSh(slug), executable: true },
    { path: "stop.sh", content: stopSh(slug), executable: true },
    { path: "start.ps1", content: startPs1(slug) },
    { path: `autostart/nemoclaw-${slug}.service`, content: systemdUnit(slug) },
    { path: `autostart/com.nemoclaw.${slug}.plist`, content: launchdPlist(slug) },
    { path: "autostart/Install-Autostart.ps1", content: windowsAutostartPs1(slug) },
    ...bottleInitFiles(env),
  ];
}

export async function buildZip(env: Environment): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const file of buildBundle(env)) {
    zip.file(file.path, file.content, {
      unixPermissions: file.executable ? 0o755 : undefined,
    });
  }
  return zip.generateAsync({ type: "uint8array", platform: "UNIX" });
}
