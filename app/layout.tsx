import type { Metadata } from "next";
import "./globals.css";
import { ClientsideProvider } from "@/components/ClientsideProvider";

export const metadata: Metadata = {
  title: "clientside-containers",
  description:
    "Run AI agents and mini OS bottles entirely in your browser — sandboxes, environments, network policy, and routed inference with no server.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientsideProvider>{children}</ClientsideProvider>
      </body>
    </html>
  );
}
