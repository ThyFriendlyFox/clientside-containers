import Link from "next/link";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    title: "Sandbox lifecycle",
    body: "Create, inspect, and tear down isolated agent sandboxes across Docker, Podman, MicroVM, and Kubernetes drivers.",
  },
  {
    title: "Declarative network policy",
    body: "Author OpenShell policy YAML and hot-reload network and inference rules on a running sandbox without a restart.",
  },
  {
    title: "Layer-7 egress engine",
    body: "Probe outbound requests and watch the policy engine allow, route for inference, or deny at the HTTP method and path level.",
  },
  {
    title: "Routed inference",
    body: "Send model traffic through the privacy router with managed backend credentials instead of caller keys.",
  },
  {
    title: "Provider credentials",
    body: "Register named credential bundles that are injected into sandboxes at creation as environment variables.",
  },
  {
    title: "Multi-agent support",
    body: "Launch OpenClaw, Hermes, or LangChain Deep Agents Code through the NemoClaw reference stack.",
  },
  {
    title: "Desktop & mobile environments",
    body: "A heavier tier with full desktops (Windows, Ubuntu) and mobile OSes (Android via Redroid or an emulator) — wire up n8n, Chrome, Playwright, or Appium app testing in one click.",
  },
  {
    title: "Container grid",
    body: "All sandboxes and environments in one running grid. Expand any into a minified OS bottle, or keep it headless — per-container settings for runtime, networking, and safety rules.",
  },
];

const STACK = [
  {
    name: "NVIDIA NemoClaw",
    role: "Reference stack & CLI for running always-on agents inside sandboxes.",
    href: "https://github.com/NVIDIA/NemoClaw",
    lang: "TypeScript",
  },
  {
    name: "NVIDIA OpenShell",
    role: "Runtime that isolates each sandbox and enforces policy-governed egress.",
    href: "https://github.com/NVIDIA/OpenShell",
    lang: "Rust",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo className="text-lg" />
        <nav className="flex items-center gap-3 text-sm">
          <a
            href="https://github.com/NVIDIA/NemoClaw"
            className="hidden text-zinc-400 hover:text-white sm:inline"
            target="_blank"
            rel="noreferrer"
          >
            NemoClaw
          </a>
          <a
            href="https://github.com/NVIDIA/OpenShell"
            className="hidden text-zinc-400 hover:text-white sm:inline"
            target="_blank"
            rel="noreferrer"
          >
            OpenShell
          </a>
          <Link href="/console" className="btn-primary">
            Open console
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="py-16 sm:py-24">
          <span className="badge border-nv-green/40 bg-nv-green/10 text-nv-green">
            Built on NVIDIA NemoClaw + OpenShell
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            A control plane for AI agents running in sandboxes.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400">
            NemoClaw Console is the web interface for the NemoClaw reference stack and the
            OpenShell runtime. Provision sandboxes, launch agents, edit network policy, and watch
            the L7 egress engine make allow, route, and deny decisions in real time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/console" className="btn-primary px-5 py-2.5 text-base">
              Open the console
            </Link>
            <Link href="/console/sandboxes" className="btn-ghost px-5 py-2.5 text-base">
              Create a sandbox
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {STACK.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="card group flex flex-col gap-2 p-6 transition-colors hover:border-nv-green/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">{s.name}</h3>
                <span className="badge border-ink-600 text-zinc-400">{s.lang}</span>
              </div>
              <p className="text-sm text-zinc-400">{s.role}</p>
              <span className="mt-2 text-sm text-nv-green opacity-0 transition-opacity group-hover:opacity-100">
                View on GitHub →
              </span>
            </a>
          ))}
        </section>

        <section className="py-20">
          <h2 className="text-2xl font-semibold text-white">What the console does</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <h3 className="font-medium text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card mb-24 overflow-hidden">
          <div className="border-b border-ink-700 px-5 py-3 text-xs uppercase tracking-wide text-zinc-500">
            How the policy engine decides
          </div>
          <pre className="overflow-x-auto p-5 text-sm leading-relaxed text-zinc-300">
            <code>{`# Inside a sandbox, every outbound connection is intercepted.
$ curl -sS https://api.github.com/zen
Anything added dilutes everything else.          # allowed by policy

$ curl -sS -X POST https://api.github.com/repos/octocat/hello-world/issues
{"error":"policy_denied","detail":"POST not permitted by policy"}  # denied (read-only)

$ claude "summarize this repo"                    # routed to managed inference`}</code>
          </pre>
        </section>
      </main>

      <footer className="border-t border-ink-800">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center">
          <Logo />
          <p>
            An open console for{" "}
            <a className="text-zinc-300 hover:text-nv-green" href="https://github.com/NVIDIA/NemoClaw" target="_blank" rel="noreferrer">
              NemoClaw
            </a>{" "}
            and{" "}
            <a className="text-zinc-300 hover:text-nv-green" href="https://github.com/NVIDIA/OpenShell" target="_blank" rel="noreferrer">
              OpenShell
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
