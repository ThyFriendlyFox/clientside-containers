import { ProviderManager } from "@/components/ProviderManager";

export const metadata = { title: "Providers · NemoClaw Console" };

export default function ProvidersPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Providers</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Named credential bundles injected into sandboxes at creation as environment variables.
        </p>
      </header>
      <ProviderManager />
    </div>
  );
}
