export const metadata = { title: "Desktop app · NemoClaw Console" };

const STEPS = [
  {
    title: "Export an environment",
    body: "From any environment, choose Download bundle. You get a Compose project, OpenShell policy, scripts, and autostart units.",
  },
  {
    title: "Open it in NemoClaw Desktop",
    body: "Add the bundle folder to the desktop app. It runs the Compose project through your local Docker engine.",
  },
  {
    title: "Toggle start on boot",
    body: "Enable autostart and the app registers a login item, then brings the environment up whenever the machine starts.",
  },
];

export default function DesktopPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-white">NemoClaw Desktop</h1>
        <p className="mt-1 text-sm text-zinc-400">
          A companion desktop app that runs exported environments outside the browser and starts
          them on boot. Source lives in the{" "}
          <span className="font-mono text-zinc-300">desktop/</span> directory of this repository.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card p-5">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-nv-green/15 text-sm font-semibold text-nv-green">
              {i + 1}
            </div>
            <h3 className="font-medium text-white">{s.title}</h3>
            <p className="mt-1.5 text-sm text-zinc-400">{s.body}</p>
          </div>
        ))}
      </div>

      <section className="card mt-8 p-5">
        <h2 className="font-medium text-white">Run the desktop app from source</h2>
        <pre className="mt-3 overflow-x-auto rounded-md border border-ink-700 bg-ink-950/60 p-4 text-sm text-zinc-300">
          <code>{`cd desktop
npm install
npm start          # launch the app
npm run dist       # build a distributable for your OS`}</code>
        </pre>
        <ul className="mt-4 space-y-2 text-sm text-zinc-400">
          <li>• Manages exported bundles and starts/stops them via <span className="font-mono text-zinc-300">docker compose</span>.</li>
          <li>• Registers a login item so enabled environments come up at boot.</li>
          <li>• Requires Docker Engine with the Compose plugin on the host.</li>
        </ul>
      </section>
    </div>
  );
}
