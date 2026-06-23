// Browser-side implementation of the console's REST API, used by the static
// GitHub Pages demo. The same simulation functions that power the server route
// handlers run here directly in the browser, so the demo is fully interactive
// with no backend.

import {
  createEnvironment,
  createProvider,
  createSandbox,
  deleteEnvironment,
  deleteProvider,
  deleteSandbox,
  execEgress,
  getEnvironment,
  getSandbox,
  listEnvironments,
  listProviders,
  listSandboxes,
  setEnvironmentAutostart,
  setPolicy,
} from "./gateway";
import { buildBundle, buildZip, envSlug } from "./export";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function notFound(): Response {
  return json({ error: "Not found" }, 404);
}

async function readBody(init?: RequestInit): Promise<unknown> {
  if (!init || init.body == null) return undefined;
  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// Routes a request to the in-browser simulation. `path` starts at "/api/...".
export async function handleDemoRequest(
  path: string,
  search: URLSearchParams,
  method: string,
  init?: RequestInit,
): Promise<Response> {
  const m = method.toUpperCase();
  const segments = path.replace(/^\/+|\/+$/g, "").split("/"); // ["api", ...]
  const rest = segments.slice(1); // drop "api"

  // /api/meta
  if (rest[0] === "meta") return json({ mode: "simulation", gatewayUrl: null });

  // /api/sandboxes...
  if (rest[0] === "sandboxes") {
    const id = rest[1];
    const sub = rest[2];
    if (!id) {
      if (m === "GET") return json(await listSandboxes());
      if (m === "POST") return json(await createSandbox((await readBody(init)) as never), 201);
    } else if (!sub) {
      if (m === "GET") return (await getSandbox(id)) ? json(await getSandbox(id)) : notFound();
      if (m === "DELETE") return (await deleteSandbox(id)) ? json({ ok: true }) : notFound();
    } else if (sub === "policy" && m === "PUT") {
      const body = (await readBody(init)) as { policy?: string };
      try {
        const sb = await setPolicy(id, body?.policy ?? "");
        return sb ? json(sb) : notFound();
      } catch (err) {
        return json({ error: (err as Error).message }, 400);
      }
    } else if (sub === "egress" && m === "POST") {
      const result = await execEgress(id, (await readBody(init)) as never);
      return result ? json(result) : notFound();
    }
  }

  // /api/providers...
  if (rest[0] === "providers") {
    const id = rest[1];
    if (!id) {
      if (m === "GET") return json(await listProviders());
      if (m === "POST") return json(await createProvider((await readBody(init)) as never), 201);
    } else if (m === "DELETE") {
      return (await deleteProvider(id)) ? json({ ok: true }) : notFound();
    }
  }

  // /api/environments...
  if (rest[0] === "environments") {
    const id = rest[1];
    const sub = rest[2];
    if (!id) {
      if (m === "GET") return json(await listEnvironments());
      if (m === "POST") return json(await createEnvironment((await readBody(init)) as never), 201);
    } else if (!sub) {
      if (m === "GET") {
        const env = await getEnvironment(id);
        return env ? json(env) : notFound();
      }
      if (m === "DELETE") return (await deleteEnvironment(id)) ? json({ ok: true }) : notFound();
      if (m === "PATCH") {
        const body = (await readBody(init)) as { autostart?: boolean };
        const env = await setEnvironmentAutostart(id, !!body?.autostart);
        return env ? json(env) : notFound();
      }
    } else if (sub === "export" && m === "GET") {
      const env = await getEnvironment(id);
      if (!env) return notFound();
      if (search.get("format") === "json") {
        return json({ slug: envSlug(env), files: buildBundle(env) });
      }
      const zip = await buildZip(env);
      return new Response(zip as BodyInit, {
        headers: {
          "content-type": "application/zip",
          "content-disposition": `attachment; filename="nemoclaw-${envSlug(env)}.zip"`,
        },
      });
    }
  }

  return notFound();
}
