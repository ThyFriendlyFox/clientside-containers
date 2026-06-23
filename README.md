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
| **Network policy** | Edit declarative OpenShell policy YAML and hot-reload the network/inference sections on a running sandbox. |
| **Egress engine** | Probe an outbound request (binary, host, port, method) and see the policy verdict, mirroring OpenShell's three-way decision. |
| **Routed inference** | Route model traffic through the privacy router to a managed backend instead of caller credentials. |
| **Providers** | Register named credential bundles that are injected into sandboxes at creation. |

## Architecture

```
app/                Next.js App Router (UI pages + API route handlers)
  page.tsx          Landing page
  console/          Authenticated console (overview, sandboxes, policies, providers)
  api/              REST endpoints backing the console
components/         React UI components
lib/
  gateway.ts        Backend adapter (simulation or real OpenShell gateway)
  policy.ts         Policy model, presets, and the egress decision engine
  store.ts          In-memory store used in simulation mode
  types.ts          Shared domain types
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
