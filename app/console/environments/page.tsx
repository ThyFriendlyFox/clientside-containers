import { EnvironmentManager } from "@/components/EnvironmentManager";

export const metadata = { title: "Environments · clientside-containers" };

export default function EnvironmentsPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Environments</h1>
        <p className="mt-1 text-sm text-zinc-400">
          The heavier tier: a mini operating system in a container — like a Bottles prefix, but a
          full desktop or mobile OS. Install programs into the bottle, open the streamed desktop in
          your browser, and play or work inside it.
        </p>
      </header>
      <EnvironmentManager />
    </div>
  );
}
