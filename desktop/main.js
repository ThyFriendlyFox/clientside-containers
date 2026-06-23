"use strict";

const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// Registered environment bundles are tracked in a small JSON file in userData.
function stateFile() {
  return path.join(app.getPath("userData"), "environments.json");
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), "utf8"));
  } catch {
    return { environments: [], openAtLogin: false };
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
  fs.writeFileSync(stateFile(), JSON.stringify(state, null, 2));
}

// Run `docker compose <args>` inside a bundle directory and resolve with output.
function dockerCompose(dir, args) {
  return new Promise((resolve) => {
    const child = spawn("docker", ["compose", ...args], { cwd: dir });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (out += d.toString()));
    child.on("error", (err) => resolve({ ok: false, output: String(err) }));
    child.on("close", (code) => resolve({ ok: code === 0, output: out, code }));
  });
}

function loadManifest(dir) {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, "clientside-containers.json"), "utf8"));
    return { name: manifest.name || path.basename(dir), autostart: !!manifest.autostart };
  } catch {
    return { name: path.basename(dir), autostart: false };
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 960,
    height: 700,
    backgroundColor: "#0a0d0a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

// --- IPC ------------------------------------------------------------------

ipcMain.handle("envs:list", () => readState().environments);

ipcMain.handle("envs:add", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (result.canceled || result.filePaths.length === 0) return null;
  const dir = result.filePaths[0];
  if (!fs.existsSync(path.join(dir, "docker-compose.yml"))) {
    return { error: "Folder does not contain docker-compose.yml" };
  }
  const state = readState();
  if (state.environments.some((e) => e.dir === dir)) return { error: "Already added" };
  const meta = loadManifest(dir);
  const entry = { id: `${Date.now()}`, dir, ...meta };
  state.environments.push(entry);
  writeState(state);
  return entry;
});

ipcMain.handle("envs:remove", (_e, id) => {
  const state = readState();
  state.environments = state.environments.filter((e) => e.id !== id);
  writeState(state);
  return true;
});

ipcMain.handle("envs:start", async (_e, id) => {
  const env = readState().environments.find((e) => e.id === id);
  if (!env) return { ok: false, output: "Not found" };
  return dockerCompose(env.dir, ["up", "-d"]);
});

ipcMain.handle("envs:stop", async (_e, id) => {
  const env = readState().environments.find((e) => e.id === id);
  if (!env) return { ok: false, output: "Not found" };
  return dockerCompose(env.dir, ["down"]);
});

ipcMain.handle("envs:setAutostart", (_e, { id, autostart }) => {
  const state = readState();
  const env = state.environments.find((x) => x.id === id);
  if (env) env.autostart = autostart;
  writeState(state);
  return true;
});

ipcMain.handle("app:getOpenAtLogin", () => readState().openAtLogin);

ipcMain.handle("app:setOpenAtLogin", (_e, openAtLogin) => {
  const state = readState();
  state.openAtLogin = openAtLogin;
  writeState(state);
  app.setLoginItemSettings({ openAtLogin });
  return true;
});

// On launch, bring up any environment flagged for autostart.
async function startAutostartEnvironments() {
  const state = readState();
  if (!state.openAtLogin) return;
  for (const env of state.environments) {
    if (env.autostart) await dockerCompose(env.dir, ["up", "-d"]);
  }
}

app.whenReady().then(async () => {
  // Reflect the persisted preference into the OS login item.
  app.setLoginItemSettings({ openAtLogin: readState().openAtLogin });
  await startAutostartEnvironments();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
