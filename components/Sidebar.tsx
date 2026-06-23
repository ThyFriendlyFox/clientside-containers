"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV = [
  { href: "/console", label: "Overview", exact: true },
  { href: "/console/sandboxes", label: "Sandboxes" },
  { href: "/console/environments", label: "Environments" },
  { href: "/console/policies", label: "Network policies" },
  { href: "/console/providers", label: "Providers" },
  { href: "/console/desktop", label: "Desktop app" },
];

export function Sidebar({ mode }: { mode: string }) {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 flex-col border-r border-ink-800 bg-ink-900/50 p-4">
      <Link href="/" className="px-2 py-1 text-base">
        <Logo />
      </Link>
      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-nv-green/10 font-medium text-nv-green"
                  : "text-zinc-400 hover:bg-ink-800 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 px-2 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${mode === "gateway" ? "bg-nv-green" : "bg-amber-400"}`} />
          <span>{mode === "gateway" ? "Connected to gateway" : "Simulation mode"}</span>
        </div>
        <div className="flex gap-3">
          <a href="https://github.com/NVIDIA/NemoClaw" target="_blank" rel="noreferrer" className="hover:text-nv-green">
            NemoClaw
          </a>
          <a href="https://github.com/NVIDIA/OpenShell" target="_blank" rel="noreferrer" className="hover:text-nv-green">
            OpenShell
          </a>
        </div>
      </div>
    </aside>
  );
}
