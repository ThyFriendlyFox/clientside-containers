"use strict";

const listEl = document.getElementById("list");
const statusEl = document.getElementById("status");
const openAtLogin = document.getElementById("openAtLogin");

function setStatus(text) {
  statusEl.textContent = text || "";
}

function render(envs) {
  listEl.innerHTML = "";
  if (!envs || envs.length === 0) {
    listEl.innerHTML = '<p class="empty">No environments yet. Add an exported bundle folder to get started.</p>';
    return;
  }
  for (const env of envs) {
    const card = document.createElement("div");
    card.className = "env";
    card.innerHTML = `
      <div class="env-head">
        <div>
          <div class="env-name"></div>
          <div class="env-dir"></div>
        </div>
        <div class="actions">
          <label class="switch"><input type="checkbox" class="autostart" ${env.autostart ? "checked" : ""}/> Autostart</label>
          <button class="start">Start</button>
          <button class="stop">Stop</button>
          <button class="remove">Remove</button>
        </div>
      </div>`;
    card.querySelector(".env-name").textContent = env.name;
    card.querySelector(".env-dir").textContent = env.dir;
    card.querySelector(".start").onclick = async () => {
      setStatus(`Starting ${env.name}…`);
      const r = await window.nemoclaw.start(env.id);
      setStatus(r.output || (r.ok ? "Started." : "Failed."));
    };
    card.querySelector(".stop").onclick = async () => {
      setStatus(`Stopping ${env.name}…`);
      const r = await window.nemoclaw.stop(env.id);
      setStatus(r.output || (r.ok ? "Stopped." : "Failed."));
    };
    card.querySelector(".remove").onclick = async () => {
      await window.nemoclaw.remove(env.id);
      await load();
    };
    card.querySelector(".autostart").onchange = async (e) => {
      await window.nemoclaw.setAutostart(env.id, e.target.checked);
    };
    listEl.appendChild(card);
  }
}

async function load() {
  render(await window.nemoclaw.list());
}

document.getElementById("add").onclick = async () => {
  const res = await window.nemoclaw.add();
  if (res && res.error) setStatus(res.error);
  await load();
};

document.getElementById("refresh").onclick = load;

openAtLogin.onchange = async (e) => {
  await window.nemoclaw.setOpenAtLogin(e.target.checked);
};

(async () => {
  openAtLogin.checked = await window.nemoclaw.getOpenAtLogin();
  await load();
})();
