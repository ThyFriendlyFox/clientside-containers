"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nemoclaw", {
  list: () => ipcRenderer.invoke("envs:list"),
  add: () => ipcRenderer.invoke("envs:add"),
  remove: (id) => ipcRenderer.invoke("envs:remove", id),
  start: (id) => ipcRenderer.invoke("envs:start", id),
  stop: (id) => ipcRenderer.invoke("envs:stop", id),
  setAutostart: (id, autostart) => ipcRenderer.invoke("envs:setAutostart", { id, autostart }),
  getOpenAtLogin: () => ipcRenderer.invoke("app:getOpenAtLogin"),
  setOpenAtLogin: (v) => ipcRenderer.invoke("app:setOpenAtLogin", v),
});
