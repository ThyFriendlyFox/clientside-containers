import { BASE_PATH } from "./base-path";

// Minimal typing for the prebuilt v86 library we load from /public at runtime.
export interface V86Emulator {
  run(): void;
  stop(): void;
  destroy(): void;
  restart(): void;
  serial0_send(data: string): void;
  add_listener(event: string, cb: (data: unknown) => void): void;
  remove_listener(event: string, cb: (data: unknown) => void): void;
  keyboard_send_scancodes(codes: number[]): void;
}

interface V86Constructor {
  new (options: Record<string, unknown>): V86Emulator;
}

let v86Promise: Promise<V86Constructor> | null = null;

/** Lazy-load the v86 ESM bundle shipped in /public (same-origin, no CDN). */
export async function loadV86(): Promise<V86Constructor> {
  if (!v86Promise) {
    v86Promise = import(/* webpackIgnore: true */ `${BASE_PATH}/v86/libv86.mjs`).then(
      (mod: { default?: V86Constructor; V86?: V86Constructor }) => {
        const V86 = mod.V86 ?? mod.default;
        if (!V86) throw new Error("v86 failed to load");
        return V86;
      },
    );
  }
  return v86Promise;
}

export interface BootOptions {
  screenContainer: HTMLElement;
  memoryMb: number;
  /** Disable the guest's network when networking is off. */
  network: "off" | "restricted" | "open";
}

const asset = (p: string) => `${BASE_PATH}/v86/${p}`;

export async function bootEmulator(opts: BootOptions): Promise<V86Emulator> {
  const V86 = await loadV86();
  const emulator = new V86({
    wasm_path: asset("v86.wasm"),
    screen_container: opts.screenContainer,
    bios: { url: asset("bios/seabios.bin") },
    vga_bios: { url: asset("bios/vgabios.bin") },
    bzimage: { url: asset("images/buildroot-bzimage68.bin") },
    autostart: true,
    memory_size: Math.max(64, opts.memoryMb) * 1024 * 1024,
    vga_memory_size: 8 * 1024 * 1024,
    disable_speaker: true,
    cmdline:
      "tsc=reliable mitigations=off random.trust_cpu=on nowatchdog page_poison=on",
  });
  return emulator;
}
