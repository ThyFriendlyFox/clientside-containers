# Clientside-Containers

A web app for running AI agents inside sandboxes, built on top of the
[NVIDIA NemoClaw](https://github.com/NVIDIA/NemoClaw) reference stack and the
[NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) runtime.

clientside-containers gives you a single web interface to provision agent sandboxes,
launch agents (OpenClaw, Hermes, LangChain Deep Agents Code), author OpenShell
network policy, and watch the layer-7 egress engine make **allow / route / deny**
decisions in real time.

## Live demo

A fully interactive demo is published to GitHub Pages:
**https://thyfriendlyfox.github.io/clientside-containers/**

Everything runs in your browser — no server. Sandboxes boot in **Web Workers**,
mini OS bottles stream in-tab, state persists in **IndexedDB**, and when
cross-origin isolation is active (via the bundled COI service worker),
**WebContainers** can boot headless Linux runtimes. Every `/api/*` call is
handled by `components/ClientsideProvider.tsx` and `lib/clientside-api.ts`.
Docker Compose export is optional for running the same bundle on a native host.

Deployed by [`Deploy demo to GitHub Pages`](.github/workflows/deploy-demo.yml)
on every push to `main`.

> **Enabling Pages (one time):** in the repository, go to **Settings → Pages**
> and set **Source** to **GitHub Actions**. The next push to `main` (or a manual
> run of the workflow) will publish the demo.

## What it does

| Area | Description |
| --- | --- |
| **Sandbox lifecycle** | Create, inspect, and terminate isolated sandboxes. Default driver is `browser` (Web Workers / WebContainers); export to `docker`, `podman`, `microvm`, or `kubernetes` when needed. |
| **Environments** | A heavier, OS-flavored tier (much like Bottles): a full desktop base plus preinstalled apps/services — e.g. n8n wired to a Chrome CDP endpoint via Playwright. |
| **Export & desktop** | Optionally export an environment as a native Docker Compose bundle, or run it from the clientside-containers Desktop companion app. Primary execution stays in the browser. |
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

The **clientside-containers Desktop** companion app (in [`desktop/`](./desktop)) is
optional — it runs exported Compose bundles on a native Docker host. The default
path is in-browser execution. See [`desktop/README.md`](./desktop/README.md).

## Architecture

```
app/                Next.js App Router (static export for GitHub Pages)
  page.tsx          Landing page
  console/          Console + in-tab runtime views
components/
  ClientsideProvider.tsx   Boots IndexedDB, fetch shim, browser runtimes
lib/
  clientside-api.ts        Browser-side REST router (no server)
  clientside-store.ts      IndexedDB hydration + persistence
  browser-runtime/         Web Workers, WebContainers, desktop bottle frames
  gateway.ts               Control plane (clientside in browser; gateway mode optional)
  policy.ts                Policy model, presets, egress engine
  environments.ts          OS bases, app catalog, templates
  compose.ts               docker-compose generator (optional native export)
  export.ts                Zip bundle for native Docker hosts
  idb-store.ts             IndexedDB adapter
  seed.ts                  First-visit demo data
desktop/            Optional Electron companion for native Docker export
```

**Clientside runtime** (default):

- **Headless sandboxes** — Web Worker agent loop in this tab; WebContainers when
  `crossOriginIsolated` (COI service worker registers on static hosts).
- **Mini OS bottles** — streamed desktop UI in an iframe (`/console/runtime/desktop`).
- **Persistence** — IndexedDB; survives reloads.
- **Policy & egress** — OpenShell policy model evaluated in-tab.

Optional **`gateway`** mode proxies to a real OpenShell gateway at
`OPENSHELL_GATEWAY_URL` for operators who want a remote control plane instead of
the in-browser runtime.

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

- `CSC_MODE` — `simulation` (default) or `gateway`.
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
