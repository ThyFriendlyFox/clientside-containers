import { EnvironmentManager } from "@/components/EnvironmentManager";

export const metadata = { title: "Environments · NemoClaw Console" };

export default function EnvironmentsPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Environments</h1>
        <p className="mt-1 text-sm text-zinc-400">
          The heavier tier: OS-flavored environments with a desktop or mobile OS and preinstalled
          apps, much like a managed bottle. Compose a base — Windows, a Linux desktop, or Android —
          wire in apps such as n8n, Chrome, or Appium app testing, then export to run on your own host.
        </p>
      </header>
      <EnvironmentManager />
    </div>
  );
}
