// OS images available to the Mini OS tier. Each describes how to boot it in v86.
// Images are bundled under public/v86/ (same-origin) so they work on any static host.

export interface OsImage {
  id: string;
  label: string;
  /** Serial Linux shell vs VGA graphical guest. */
  kind: "linux" | "windows" | "desktop";
  blurb: string;
  memoryMb: number;
  vgaMemoryMb: number;
  /** v86 media — paths are under public/v86/. */
  bzimage?: { path: string };
  fda?: { path: string };
  cdrom?: { path: string; sizeBytes?: number };
  hda?: { path: string; sizeBytes?: number };
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
    fda: { path: "images/windows101.img" },
  },
  {
    id: "ubuntu1004",
    label: "Ubuntu 10.04 Desktop",
    kind: "desktop",
    blurb:
      "Ubuntu Lucid Lynx with the GNOME desktop (32-bit live CD). First boot loads the ~694 MB image; allow a few minutes to reach the desktop.",
    memoryMb: 512,
    vgaMemoryMb: 16,
    cdrom: {
      path: "images/ubuntu-1004-desktop-i386.iso",
      sizeBytes: 728_150_016,
    },
  },
];

/** True when the guest renders to the VGA canvas (not the serial terminal). */
export function isGraphicalOsImage(image: OsImage): boolean {
  return image.kind === "windows" || image.kind === "desktop";
}

export function getOsImage(id: string | undefined): OsImage {
  return OS_IMAGES.find((i) => i.id === id) ?? OS_IMAGES[0];
}
