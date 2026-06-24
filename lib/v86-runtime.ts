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

import type { OsImage } from "./os-images";

export interface BootOptions {
  screenContainer: HTMLElement;
  image: OsImage;
  /** Override the image's default RAM (MiB). */
  memoryMb?: number;
}

const asset = (p: string) => `${BASE_PATH}/v86/${p}`;

export async function bootEmulator(opts: BootOptions): Promise<V86Emulator> {
  const V86 = await loadV86();
  const { image } = opts;

  const config: Record<string, unknown> = {
    wasm_path: asset("v86.wasm"),
    screen_container: opts.screenContainer,
    bios: { url: asset("bios/seabios.bin") },
    vga_bios: { url: asset("bios/vgabios.bin") },
    autostart: true,
    memory_size: Math.max(32, opts.memoryMb ?? image.memoryMb) * 1024 * 1024,
    vga_memory_size: image.vgaMemoryMb * 1024 * 1024,
    disable_speaker: true,
  };

  if (image.bzimage) config.bzimage = { url: asset(image.bzimage.path) };
  if (image.cmdline) config.cmdline = image.cmdline;
  if (image.fda) config.fda = { url: asset(image.fda.path) };
  if (image.cdrom) config.cdrom = { url: asset(image.cdrom.path), async: true };
  if (image.hda) config.hda = { url: asset(image.hda.path), async: true, size: image.hda.sizeBytes };

  return new V86(config);
}
