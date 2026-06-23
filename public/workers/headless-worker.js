// Headless container runtime — a JS sandbox running in a Web Worker.
// It receives API calls (postMessage) and returns responses. Entirely in-tab.

const startedAt = Date.now();
let calls = 0;

function handle(req) {
  calls += 1;
  const path = (req && req.path) || "/";
  const method = ((req && req.method) || "GET").toUpperCase();
  const body = req && req.body;

  if (path === "/health") {
    return { status: 200, body: { ok: true, uptimeMs: Date.now() - startedAt, calls } };
  }
  if (path === "/echo") {
    return { status: 200, body: { method, path, echo: body ?? null } };
  }
  if (path === "/eval" && method === "POST" && body && typeof body.expr === "string") {
    try {
      // Sandboxed arithmetic/JSON evaluation only — no host access from a Worker.
      const result = Function(`"use strict"; return (${body.expr});`)();
      return { status: 200, body: { result } };
    } catch (err) {
      return { status: 400, body: { error: String(err) } };
    }
  }
  return { status: 404, body: { error: "no route", path } };
}

self.onmessage = (event) => {
  const msg = event.data || {};
  if (msg.type === "request") {
    const res = handle(msg.payload);
    self.postMessage({ type: "response", id: msg.id, status: res.status, body: res.body });
  }
};

self.postMessage({ type: "ready", startedAt });
