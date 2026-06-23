# NemoClaw Desktop

Companion desktop app for [NemoClaw Console](../). It runs environments that you
exported from the console on your own machine, outside the browser, and can start
them when the computer boots.

## What it does

- Add an exported bundle folder (the one containing `docker-compose.yml` and
  `nemoclaw-env.json`).
- Start and stop each environment through your local Docker engine
  (`docker compose up -d` / `down`).
- Per-environment **Autostart** toggle plus a global **Launch at boot** switch.
  When both are on, the app registers an OS login item and brings the flagged
  environments up at startup.

## Requirements

- [Docker Engine](https://docs.docker.com/engine/) with the Compose plugin.
- Node.js 18+ to run or build the app from source.

## Develop / run

```bash
npm install
npm start
```

## Build a distributable

```bash
npm run dist
```

This produces an installer for the current OS (AppImage on Linux, NSIS on
Windows, dmg/zip on macOS) under `dist/`.

## How it fits together

```
NemoClaw Console  ──(Download bundle .zip)──▶  bundle folder
                                                  │
                                                  ▼
NemoClaw Desktop  ──(docker compose up -d)──▶  local Docker engine
                  ──(login item)────────────▶  start on boot
```
