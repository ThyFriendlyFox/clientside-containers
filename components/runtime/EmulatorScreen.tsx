"use client";

import { useEffect, useRef, useState } from "react";
import { bootEmulator, type V86Emulator } from "@/lib/v86-runtime";
import type { Container } from "@/lib/container";
import { getBottledApp } from "@/lib/container";

interface Props {
  container: Container;
  onStatus?: (status: Container["status"]) => void;
}

export function EmulatorScreen({ container, onStatus }: Props) {
  const screenRef = useRef<HTMLDivElement>(null);
  const emulatorRef = useRef<V86Emulator | null>(null);
  const [phase, setPhase] = useState<"loading" | "booting" | "running" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let serialBuffer = "";
    let appLaunched = false;

    const bottle = container.tier === "app" ? getBottledApp(container.appId) : null;

    function onSerial(byte: unknown) {
      if (typeof byte !== "number") return;
      serialBuffer += String.fromCharCode(byte);
      if (serialBuffer.length > 4096) serialBuffer = serialBuffer.slice(-1024);
      // Once the guest shell prompt appears, auto-launch the bottled app.
      if (bottle && !appLaunched && /(#|\$)\s$/.test(serialBuffer)) {
        appLaunched = true;
        emulatorRef.current?.serial0_send(`${bottle.command}\n`);
      }
    }

    async function start() {
      if (!screenRef.current) return;
      try {
        setPhase("booting");
        onStatus?.("booting");
        const emulator = await bootEmulator({
          screenContainer: screenRef.current,
          memoryMb: container.settings.memoryMb,
          network: container.settings.network,
        });
        if (disposed) {
          emulator.destroy();
          return;
        }
        emulatorRef.current = emulator;
        emulator.add_listener("serial0-output-byte", onSerial);
        emulator.add_listener("emulator-started", () => {
          if (!disposed) {
            setPhase("running");
            onStatus?.("running");
          }
        });
      } catch (err) {
        if (!disposed) {
          setError((err as Error).message);
          setPhase("error");
          onStatus?.("error");
        }
      }
    }

    void start();

    return () => {
      disposed = true;
      const em = emulatorRef.current;
      if (em) {
        try {
          em.remove_listener("serial0-output-byte", onSerial);
          em.destroy();
        } catch {
          /* ignore teardown errors */
        }
      }
      emulatorRef.current = null;
    };
    // Boot once per mount; settings changes take effect on restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container.id]);

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      {phase !== "running" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/90 text-sm text-zinc-300">
          {phase === "error" ? (
            <>
              <p className="text-red-400">Failed to boot</p>
              <p className="max-w-md text-center text-xs text-zinc-500">{error}</p>
            </>
          ) : (
            <>
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-nv-green" />
              <p>{phase === "loading" ? "Loading emulator…" : "Booting minified Linux…"}</p>
              <p className="text-xs text-zinc-600">first boot fetches a ~10&nbsp;MB kernel image</p>
            </>
          )}
        </div>
      )}
      <div
        ref={screenRef}
        className="flex-1 overflow-hidden"
        // v86 toggles between the text node and the canvas depending on VGA mode.
        style={{ background: "#000" }}
      >
        <div
          style={{
            whiteSpace: "pre",
            font: "14px / 1.05 monospace",
            color: "#e5e5e5",
            padding: "8px",
          }}
        />
        <canvas style={{ display: "none" }} />
      </div>
    </div>
  );
}
