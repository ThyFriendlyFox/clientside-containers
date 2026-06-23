import yaml from "js-yaml";
import { DEFAULT_POLICY, PRESETS } from "@/lib/policy";

export const metadata = { title: "Network policies · clientside-containers" };

const LAYERS = [
  { layer: "Filesystem", protects: "Reads/writes outside allowed paths.", when: "Locked at sandbox creation." },
  { layer: "Network", protects: "Unauthorized outbound connections.", when: "Hot-reloadable at runtime." },
  { layer: "Process", protects: "Privilege escalation and dangerous syscalls.", when: "Locked at sandbox creation." },
  { layer: "Inference", protects: "Model API calls rerouted to controlled backends.", when: "Hot-reloadable at runtime." },
];

export default function PoliciesPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Network policies</h1>
        <p className="mt-1 text-sm text-zinc-400">
          OpenShell policies are declarative YAML. Static sections lock at creation; network and inference
          sections hot-reload on a running sandbox.
        </p>
      </header>

      <section className="card mb-8 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-700 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-5 py-3">Layer</th>
              <th className="px-5 py-3">What it protects</th>
              <th className="px-5 py-3">When it applies</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {LAYERS.map((l) => (
              <tr key={l.layer}>
                <td className="px-5 py-3 font-medium text-white">{l.layer}</td>
                <td className="px-5 py-3 text-zinc-400">{l.protects}</td>
                <td className="px-5 py-3 text-zinc-400">{l.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2 className="mb-3 text-lg font-medium text-white">Policy presets</h2>
      <div className="space-y-4">
        {PRESETS.map((preset) => {
          const applied = preset.apply(DEFAULT_POLICY);
          const fragment =
            preset.id === "anthropic-inference"
              ? { inference_policies: applied.inference_policies }
              : { network_policies: applied.network_policies };
          return (
            <div key={preset.id} className="card overflow-hidden">
              <div className="border-b border-ink-700 px-5 py-3">
                <h3 className="font-medium text-white">{preset.label}</h3>
                <p className="mt-1 text-sm text-zinc-400">{preset.description}</p>
              </div>
              <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-zinc-300">
                <code>{yaml.dump(fragment, { lineWidth: 100, noRefs: true, sortKeys: false })}</code>
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
