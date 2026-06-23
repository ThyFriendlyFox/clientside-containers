import { SandboxManager } from "@/components/SandboxManager";

export const metadata = { title: "Sandboxes · clientside-containers" };

export default function SandboxesPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Sandboxes</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Provision isolated agent runtimes and manage their lifecycle.
        </p>
      </header>
      <SandboxManager />
    </div>
  );
}
