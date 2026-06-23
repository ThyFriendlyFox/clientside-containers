// Agent sandbox runtime — the smallest tier, modeled on NVIDIA OpenShell.
// A policy-governed agent runtime in a Web Worker. It answers API calls and
// makes allow/deny egress decisions against a declarative policy, all in-tab.

const startedAt = Date.now();
let calls = 0;

// Policy is supplied by the main thread (parsed from YAML there).
let policy = { network: { default: "deny", allow: [] }, filesystem: { writable: [], readonly: [] } };

function evaluateEgress(req) {
  const method = String(req.method || "GET").toUpperCase();
  const host = String(req.host || "");
  const match = (policy.network.allow || []).find(
    (r) => r.host === host && (r.methods.includes(method) || r.methods.includes("*")),
  );
  if (match) return { verdict: "allow", reason: `matched allow rule for ${match.host}` };
  if (policy.network.default === "allow") return { verdict: "allow", reason: "default policy is allow" };
  return { verdict: "deny", reason: `no rule permits ${method} ${host}` };
}

function handle(req) {
  calls += 1;
  const path = (req && req.path) || "/";
  const method = ((req && req.method) || "GET").toUpperCase();
  const body = req && req.body;

  if (path === "/health") {
    return { status: 200, body: { ok: true, uptimeMs: Date.now() - startedAt, calls } };
  }
  if (path === "/policy") {
    return { status: 200, body: policy };
  }
  if (path === "/egress" && method === "POST" && body && body.host) {
    const decision = evaluateEgress(body);
    return { status: decision.verdict === "allow" ? 200 : 403, body: decision };
  }
  if (path === "/echo") {
    return { status: 200, body: { method, path, echo: body ?? null } };
  }
  if (path === "/eval" && method === "POST" && body && typeof body.expr === "string") {
    try {
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
  if (msg.type === "policy" && msg.policy) {
    policy = msg.policy;
    self.postMessage({ type: "policy-applied" });
    return;
  }
  if (msg.type === "request") {
    const res = handle(msg.payload);
    self.postMessage({ type: "response", id: msg.id, status: res.status, body: res.body });
  }
};

self.postMessage({ type: "ready", startedAt });
