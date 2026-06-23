import Link from "next/link";
import { listSandboxes, listProviders, listEnvironments, MODE } from "@/lib/gateway";
import { AGENTS } from "@/lib/types";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [sandboxes, environments, providers] = await Promise.all([
    listSandboxes(),
    listEnvironments(),
    listProviders(),
  ]);
  const stats = [
    { label: "Sandboxes", value: sandboxes.length },
    { label: "Environments", value: environments.length },
    { label: "Providers", value: providers.length },
    { label: "Backend mode", value: MODE },
  ];

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Overview</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage agent sandboxes, network policy, and inference routing across the OpenShell runtime.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-500">{s.label}</div>
            <div className="mt-2 text-2xl font-semibold capitalize text-white">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Recent sandboxes</h2>
          <Link href="/console/sandboxes" className="text-sm text-nv-green hover:underline">
            View all →
          </Link>
        </div>
        <div className="card divide-y divide-ink-800">
          {sandboxes.length === 0 && (
            <div className="p-6 text-sm text-zinc-500">
              No sandboxes yet.{" "}
              <Link href="/console/sandboxes" className="text-nv-green hover:underline">
                Create one
              </Link>
              .
            </div>
          )}
          {sandboxes.slice(0, 5).map((s) => (
            <Link
              key={s.id}
              href={`/console/sandboxes/${s.id}`}
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-ink-800/50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-white">{s.name}</span>
                <span className="font-mono text-xs text-zinc-500">{s.id}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400">{AGENTS[s.agent].label}</span>
                <span className="text-xs text-zinc-500">{s.driver}</span>
                <StatusBadge status={s.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Environments</h2>
          <Link href="/console/environments" className="text-sm text-nv-green hover:underline">
            View all →
          </Link>
        </div>
        <div className="card divide-y divide-ink-800">
          {environments.length === 0 && (
            <div className="p-6 text-sm text-zinc-500">
              No environments yet.{" "}
              <Link href="/console/environments" className="text-nv-green hover:underline">
                Create one
              </Link>
              .
            </div>
          )}
          {environments.slice(0, 5).map((env) => (
            <Link
              key={env.id}
              href={`/console/environments/${env.id}`}
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-ink-800/50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-white">{env.name}</span>
                <span className="font-mono text-xs text-zinc-500">{env.id}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-zinc-400">{env.apps.join(", ") || "base only"}</span>
                {env.autostart && <span className="text-xs text-nv-green">autostart</span>}
                <StatusBadge status={env.status} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
