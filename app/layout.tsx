import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "clientside-containers",
  description: "Containers that run entirely in your browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
