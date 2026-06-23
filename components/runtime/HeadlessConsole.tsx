"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";
import type { Container } from "@/lib/container";

interface LogLine {
  dir: "in" | "out" | "sys";
  text: string;
}

const SAMPLES = [
  { method: "GET", path: "/health", body: "" },
  { method: "GET", path: "/echo", body: '{ "hello": "world" }' },
  { method: "POST", path: "/eval", body: '{ "expr": "2 + 40" }' },
];

export function HeadlessConsole({ container, onStatus }: { container: Container; onStatus?: (s: Container["status"]) => void }) {
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const pending = useRef(new Map<number, (v: { status: number; body: unknown }) => void>());
  const [ready, setReady] = useState(false);
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/health");
  const [body, setBody] = useState("");
  const [log, setLog] = useState<LogLine[]>([]);

  useEffect(() => {
    const worker = new Worker(`${BASE_PATH}/workers/headless-worker.js`, { type: "classic" });
    workerRef.current = worker;
    worker.onmessage = (ev) => {
      const msg = ev.data || {};
      if (msg.type === "ready") {
        setReady(true);
        onStatus?.("running");
        setLog((l) => [...l, { dir: "sys", text: "worker ready — accepting API calls" }]);
      } else if (msg.type === "response") {
        const resolve = pending.current.get(msg.id);
        if (resolve) {
          pending.current.delete(msg.id);
          resolve({ status: msg.status, body: msg.body });
        }
      }
    };
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container.id]);

  const send = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;
    let parsed: unknown = undefined;
    if (body.trim()) {
      try {
        parsed = JSON.parse(body);
      } catch {
        setLog((l) => [...l, { dir: "sys", text: "request body is not valid JSON" }]);
        return;
      }
    }
    const id = ++reqId.current;
    setLog((l) => [...l, { dir: "in", text: `${method} ${path}${parsed !== undefined ? ` ${JSON.stringify(parsed)}` : ""}` }]);
    const p = new Promise<{ status: number; body: unknown }>((resolve) => pending.current.set(id, resolve));
    worker.postMessage({ type: "request", id, payload: { method, path, body: parsed } });
    p.then((res) => {
      setLog((l) => [...l, { dir: "out", text: `${res.status} ${JSON.stringify(res.body)}` }]);
    });
  }, [method, path, body]);

  return (
    <div className="flex h-full w-full flex-col bg-ink-950">
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
        {log.length === 0 ? (
          <p className="text-zinc-600">No calls yet. Send a request below.</p>
        ) : (
          log.map((line, i) => (
            <div
              key={i}
              className={
                line.dir === "in"
                  ? "text-sky-300"
                  : line.dir === "out"
                    ? "text-nv-green"
                    : "text-zinc-500"
              }
            >
              <span className="select-none text-zinc-600">
                {line.dir === "in" ? "→ " : line.dir === "out" ? "← " : "• "}
              </span>
              {line.text}
            </div>
          ))
        )}
      </div>
      <div className="border-t border-ink-700 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SAMPLES.map((s) => (
            <button
              key={s.path + s.method}
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={() => {
                setMethod(s.method);
                setPath(s.path);
                setBody(s.body);
              }}
            >
              {s.method} {s.path}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="input w-24"
            aria-label="HTTP method"
          >
            <option>GET</option>
            <option>POST</option>
          </select>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="input flex-1"
            placeholder="/health"
            aria-label="Request path"
          />
          <button type="button" onClick={send} disabled={!ready} className="btn-primary text-sm">
            Send
          </button>
        </div>
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input mt-2 font-mono text-xs"
          placeholder='JSON body, e.g. { "expr": "2 + 2" }'
          aria-label="Request body"
        />
      </div>
    </div>
  );
}
