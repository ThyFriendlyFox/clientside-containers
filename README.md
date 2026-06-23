# Clientside-Containers

A web console for running AI agents inside sandboxes, built on top of the
[NVIDIA NemoClaw](https://github.com/NVIDIA/NemoClaw) reference stack and the
[NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) runtime.

NemoClaw Console gives you a single web interface to provision agent sandboxes,
launch agents (OpenClaw, Hermes, LangChain Deep Agents Code), author OpenShell
network policy, and watch the layer-7 egress engine make **allow / route / deny**
decisions in real time.

## Live demo

A fully interactive demo is published to GitHub Pages:
**https://thyfriendlyfox.github.io/clientside-containers/**

The demo is a static export that runs the simulation backend entirely in the
browser — every `/api/*` call is served client-side (see
`components/DemoBridge.tsx`), so sandboxes, environments, policy editing, the
egress checker, and bundle export all work with no server. It is deployed by the
[`Deploy demo to GitHub Pages`](.github/workflows/deploy-demo.yml) workflow on
every push to `main`.

> **Enabling Pages (one time):** in the repository, go to **Settings → Pages**
> and set **Source** to **GitHub Actions**. The next push to `main` (or a manual
> run of the workflow) will publish the demo.

## What it does

| Area | Description |
| --- | --- |
| **Sandbox lifecycle** | Create, inspect, and terminate isolated sandboxes across the `docker`, `podman`, `microvm`, and `kubernetes` compute drivers. |
| **Environments** | A heavier, OS-flavored tier (much like Bottles): a full desktop base plus preinstalled apps/services — e.g. n8n wired to a Chrome CDP endpoint via Playwright. |
| **Export & desktop** | Export an environment as a runnable Compose bundle with autostart units, or run it from the NemoClaw Desktop companion app that starts it on boot. |
| **Network policy** | Edit declarative OpenShell policy YAML and hot-reload the network/inference sections on a running sandbox. |
| **Egress engine** | Probe an outbound request (binary, host, port, method) and see the policy verdict, mirroring OpenShell's three-way decision. |
| **Routed inference** | Route model traffic through the privacy router to a managed backend instead of caller credentials. |
| **Providers** | Register named credential bundles that are injected into sandboxes at creation. |

## Environments and the desktop app

The **Environments** tab builds the heavier, "simulate an OS" experience:

- Pick an **OS base**:
  - **Desktop** — Windows (KVM, via `dockurr/windows`), an Ubuntu/Fedora XFCE
    desktop (KasmVNC), or headless.
  - **Mobile** — Android via [Redroid](https://github.com/remote-android/redroid-doc)
    (Android-in-a-container over ADB) or a full Android emulator with a web screen
    view and Appium ([`budtmo/docker-android`](https://github.com/budtmo/docker-android)).
    iOS is offered as an **external macOS runner** target (iOS cannot run in a Linux
    container, so it drives a macOS host over Appium/WebDriverAgent).
- Add **apps & services** from the catalog (n8n, a Chrome CDP endpoint,
  Playwright, VS Code, PostgreSQL, Appium, ws-scrcpy, OpenTTD (desktop game in a bottle), …).
  Templates wire common
  combinations so that, for example, **n8n drives Chrome through Playwright**, or
  **Appium tests an app on the Android emulator**, over the internal network out
  of the box.
- **Export** the environment as a `.zip` bundle containing a `docker-compose.yml`,
  the OpenShell policy, start/stop scripts, and autostart units for systemd,
  launchd, and Windows Task Scheduler.

The **NemoClaw Desktop** companion app (in [`desktop/`](./desktop)) runs those
bundles on the user's machine via Docker and registers a login item so flagged
environments start on boot — taking the environment off the browser and onto the
desktop. See [`desktop/README.md`](./desktop/README.md).

## Architecture

```
app/                Next.js App Router (UI pages + API route handlers)
  page.tsx          Landing page
  console/          Console (overview, sandboxes, environments, policies, providers, desktop)
  api/              REST endpoints backing the console
components/         React UI components
lib/
  gateway.ts        Backend adapter (simulation or real OpenShell gateway)
  policy.ts         Policy model, presets, and the egress decision engine
  environments.ts   OS bases, app catalog, and environment templates
  compose.ts        docker-compose generator (desktop + n8n + Chrome CDP wiring)
  export.ts         Export bundle generator (scripts + autostart units + zip)
  store.ts          In-memory store used in simulation mode
  types.ts          Shared domain types
desktop/            Electron companion app: run bundles locally, start on boot
```

The console talks to a **backend adapter** (`lib/gateway.ts`) that runs in one of
two modes:

- **`simulation`** (default) — an in-process model of the OpenShell gateway and
  policy engine. The console is fully functional with no external dependencies,
  which makes it suitable for local development and demos.
- **`gateway`** — proxies requests to a real OpenShell gateway control-plane API
  at `OPENSHELL_GATEWAY_URL`.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional; defaults work out of the box
npm run dev
```

Open <http://localhost:3000>. The landing page links into `/console`.

### Production build

```bash
npm run build
npm run start
```

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build. |
| `npm run start` | Run the production server. |
| `npm run lint` | ESLint (Next.js config). |
| `npm run typecheck` | TypeScript type checking. |

## Configuration

See [`.env.example`](./.env.example). Key variables:

- `NEMOCLAW_CONSOLE_MODE` — `simulation` (default) or `gateway`.
- `OPENSHELL_GATEWAY_URL` — base URL of a running OpenShell gateway (gateway mode).
- `OPENSHELL_GATEWAY_TOKEN` — optional bearer token for the gateway.

## Policy format

Policies follow the OpenShell `policy.yaml` schema. Static sections
(`filesystem_policy`, `process`) lock at sandbox creation; `network_policies` and
`inference_policies` hot-reload at runtime. See the
[OpenShell quickstart policy](https://github.com/NVIDIA/OpenShell/blob/main/examples/sandbox-policy-quickstart/policy.yaml)
for reference.

## License

GPL-3.0-only. See [LICENSE](./LICENSE).

> This project is an independent console for the NemoClaw and OpenShell open
> source projects and is not an official NVIDIA product.
