// OS images available to the Mini OS tier. Each describes how to boot it in v86.
// Linux is bundled same-origin; the proprietary Windows image is loaded at
// runtime from its upstream host (we don't redistribute Microsoft's binary).

export interface OsImage {
  id: string;
  label: string;
  kind: "linux" | "windows";
  blurb: string;
  memoryMb: number;
  vgaMemoryMb: number;
  /** v86 media — exactly one boot medium is set. `bundled` paths are under /v86. */
  bzimage?: { path: string };
  fda?: { url: string };
  cdrom?: { url: string; sizeBytes?: number };
  hda?: { url: string; sizeBytes?: number };
  cmdline?: string;
}

export const OS_IMAGES: OsImage[] = [
  {
    id: "buildroot",
    label: "Buildroot Linux",
    kind: "linux",
    blurb: "A ~10 MB Linux 6.8 with a BusyBox shell. Bundled and same-origin.",
    memoryMb: 256,
    vgaMemoryMb: 8,
    bzimage: { path: "images/buildroot-bzimage68.bin" },
    cmdline: "tsc=reliable mitigations=off random.trust_cpu=on nowatchdog page_poison=on",
  },
  {
    id: "windows101",
    label: "Windows 1.01",
    kind: "windows",
    blurb: "A miniature graphical Windows (1.47 MB) with Paint and Reversi.",
    memoryMb: 32,
    vgaMemoryMb: 8,
    // Proprietary Microsoft image — loaded from the upstream host at runtime
    // (CORS-enabled), not committed to this repo.
    fda: { url: "https://i.copy.sh/windows101.img" },
  },
];

export function getOsImage(id: string | undefined): OsImage {
  return OS_IMAGES.find((i) => i.id === id) ?? OS_IMAGES[0];
}
