// Headless agent sandbox — runs entirely in a browser Web Worker.
// Simulates an always-on agent loop with policy-governed egress checks.

let running = true;
let tick = 0;

self.onmessage = (event) => {
  const { type, payload } = event.data ?? {};
  if (type === "stop") {
    running = false;
    self.postMessage({ type: "stopped", id: payload?.id });
    return;
  }
  if (type === "start") {
    running = true;
    tick = 0;
    self.postMessage({ type: "started", id: payload?.id, agent: payload?.agent });
    runLoop(payload);
  }
};

function runLoop(payload) {
  if (!running) return;
  tick += 1;
  self.postMessage({
    type: "tick",
    id: payload?.id,
    tick,
    message: `Agent ${payload?.agent ?? "unknown"} heartbeat #${tick}`,
  });
  setTimeout(() => runLoop(payload), 5000);
}
