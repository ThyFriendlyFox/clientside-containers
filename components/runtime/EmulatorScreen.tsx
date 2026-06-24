"use client";

import { useEffect, useRef, useState } from "react";
import { bootEmulator, type V86Emulator } from "@/lib/v86-runtime";
import type { Container } from "@/lib/container";
import { getOsImage } from "@/lib/os-images";
import { getConfig } from "@/lib/configs";

interface Props {
  container: Container;
  onStatus?: (status: Container["status"]) => void;
}

// Map a keyboard event to bytes for the serial console.
function keyToBytes(e: React.KeyboardEvent): string | null {
  if (e.key === "Enter") return "\r";
  if (e.key === "Backspace") return "\x7f";
  if (e.key === "Tab") return "\t";
  if (e.key === "Escape") return "\x1b";
  if (e.ctrlKey && e.key.length === 1) {
    const code = e.key.toUpperCase().charCodeAt(0) - 64;
    if (code > 0 && code < 27) return String.fromCharCode(code);
    return null;
  }
  if (e.key.length === 1) return e.key;
  return null;
}

export function EmulatorScreen({ container, onStatus }: Props) {
  const screenRef = useRef<HTMLDivElement>(null);
  const serialRef = useRef<HTMLPreElement>(null);
  const emulatorRef = useRef<V86Emulator | null>(null);
  const [phase, setPhase] = useState<"loading" | "booting" | "running" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [serial, setSerial] = useState("");

  const image = container.tier === "minios" ? getOsImage(container.imageId) : getOsImage("buildroot");
  const graphical = image.kind === "windows";
  const config = container.tier === "app" ? getConfig(container.configId) : null;

  useEffect(() => {
    let disposed = false;
    let buffer = "";
    let provisioned = false;

    function onSerial(byte: unknown) {
      if (typeof byte !== "number") return;
      const ch = String.fromCharCode(byte);
      buffer += ch;
      if (buffer.length > 200_000) buffer = buffer.slice(-100_000);
      if (!disposed) setSerial(buffer);

      // Once the shell prompt appears, run the config's commands in order.
      if (config && config.commands.length && !provisioned && /[#$]\s$/.test(buffer)) {
        provisioned = true;
        let i = 0;
        const sendNext = () => {
          if (disposed || i >= config.commands.length) return;
          emulatorRef.current?.serial0_send(`${config.commands[i]}\n`);
          i += 1;
          setTimeout(sendNext, 700);
        };
        sendNext();
      }
    }

    async function start() {
      if (!screenRef.current) return;
      try {
        setPhase("booting");
        onStatus?.("booting");
        const emulator = await bootEmulator({
          screenContainer: screenRef.current,
          image,
          memoryMb: container.settings.memoryMb,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container.id]);

  useEffect(() => {
    const el = serialRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [serial]);

  function onTerminalKey(e: React.KeyboardEvent) {
    const bytes = keyToBytes(e);
    if (bytes !== null) {
      e.preventDefault();
      emulatorRef.current?.serial0_send(bytes);
    }
  }

  const overlay = phase !== "running" && (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/90 text-sm text-zinc-300">
      {phase === "error" ? (
        <>
          <p className="text-red-400">Failed to boot</p>
          <p className="max-w-md text-center text-xs text-zinc-500">{error}</p>
        </>
      ) : (
        <>
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-nv-green" />
          <p>{phase === "loading" ? "Loading emulator…" : `Booting ${image.label}…`}</p>
          <p className="text-xs text-zinc-600">first boot fetches the OS image</p>
        </>
      )}
    </div>
  );

  return (
    <div className="relative h-full w-full bg-black">
      {overlay}

      {/* Graphical OSes (e.g. Windows) render to the VGA screen. */}
      <div
        ref={screenRef}
        className={graphical ? "flex h-full w-full items-center justify-center" : "pointer-events-none absolute -left-[9999px] h-1 w-1 overflow-hidden"}
        style={{ background: "#000" }}
      >
        <div style={{ whiteSpace: "pre", font: "14px / 1.05 monospace", color: "#e5e5e5" }} />
        <canvas style={{ display: graphical ? "block" : "none" }} />
      </div>

      {/* Linux containers run their config in a serial terminal. */}
      {!graphical && (
        <div
          tabIndex={0}
          onKeyDown={onTerminalKey}
          className="h-full w-full cursor-text outline-none"
          onClick={() => serialRef.current?.parentElement?.focus()}
        >
          <pre
            ref={serialRef}
            className="h-full w-full overflow-auto bg-black p-3 font-mono text-xs leading-snug text-zinc-200"
          >
            {serial || ""}
          </pre>
        </div>
      )}
    </div>
  );
}
