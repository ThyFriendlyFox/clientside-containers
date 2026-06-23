# NemoClaw Console

A web console for running AI agents inside sandboxes, built on top of the
[NVIDIA NemoClaw](https://github.com/NVIDIA/NemoClaw) reference stack and the
[NVIDIA OpenShell](https://github.com/NVIDIA/OpenShell) runtime.

NemoClaw Console gives you a single web interface to provision agent sandboxes,
launch agents (OpenClaw, Hermes, LangChain Deep Agents Code), author OpenShell
network policy, and watch the layer-7 egress engine make **allow / route / deny**
decisions in real time.

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

- Pick an **OS base** — Windows (KVM, via `dockurr/windows`), an Ubuntu/Fedora
  XFCE desktop (KasmVNC), or headless.
- Add **apps & services** from the catalog (n8n, a Chrome CDP endpoint,
  Playwright, VS Code, PostgreSQL, …). Templates wire common combinations so that,
  for example, **n8n drives Chrome through Playwright** over the internal network
  out of the box.
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
