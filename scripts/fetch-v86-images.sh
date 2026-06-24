#!/usr/bin/env bash
# Fetch large v86 disk images into public/v86/images/ (same-origin at deploy time).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMG_DIR="$ROOT/public/v86/images"
mkdir -p "$IMG_DIR"

fetch() {
  local url="$1"
  local dest="$2"
  if [[ -f "$dest" ]]; then
    echo "skip (exists): $(basename "$dest")"
    return 0
  fi
  echo "fetch: $url"
  curl -fL --compressed --retry 3 --retry-delay 5 -o "$dest" "$url"
}

# Ubuntu 10.04 Desktop (i386) — the last Ubuntu release proven to boot a full
# GNOME desktop in v86 (32-bit, no 64-bit kernel). ~694 MB compressed.
UBUNTU_ISO="$IMG_DIR/ubuntu-1004-desktop-i386.iso"
fetch \
  "http://old-releases.ubuntu.com/releases/10.04.0/ubuntu-10.04.4-desktop-i386.iso" \
  "$UBUNTU_ISO"

echo "v86 images ready in $IMG_DIR"
