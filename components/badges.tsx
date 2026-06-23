import type { SandboxStatus, Verdict } from "@/lib/types";

const STATUS_STYLES: Record<SandboxStatus, string> = {
  running: "border-nv-green/40 bg-nv-green/10 text-nv-green",
  provisioning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  stopped: "border-zinc-600 bg-zinc-700/20 text-zinc-400",
  error: "border-red-500/40 bg-red-500/10 text-red-300",
};

export function StatusBadge({ status }: { status: SandboxStatus }) {
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

const VERDICT_STYLES: Record<Verdict, string> = {
  allow: "border-nv-green/40 bg-nv-green/10 text-nv-green",
  route: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  deny: "border-red-500/40 bg-red-500/10 text-red-300",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`badge uppercase ${VERDICT_STYLES[verdict]}`}>{verdict}</span>;
}
