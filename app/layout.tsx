import type { Metadata } from "next";
import "./globals.css";
import { DemoBridge } from "@/components/DemoBridge";

export const metadata: Metadata = {
  title: "clientside-containers",
  description:
    "Run AI agents like OpenClaw, Hermes, and LangChain Deep Agents Code inside NVIDIA OpenShell sandboxes — manage lifecycle, network policy, and routed inference from one console.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoBridge />
        {children}
      </body>
    </html>
  );
}
