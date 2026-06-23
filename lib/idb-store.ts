import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Environment, Provider, Sandbox } from "./types";

const DB_NAME = "clientside-containers";
const DB_VERSION = 1;

interface CscDb extends DBSchema {
  sandboxes: { key: string; value: Sandbox };
  environments: { key: string; value: Environment };
  providers: { key: string; value: Provider };
  meta: { key: string; value: boolean | number | string };
}

let dbPromise: Promise<IDBPDatabase<CscDb>> | null = null;

function getDb(): Promise<IDBPDatabase<CscDb>> {
  if (!dbPromise) {
    dbPromise = openDB<CscDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("sandboxes");
        db.createObjectStore("environments");
        db.createObjectStore("providers");
        db.createObjectStore("meta");
      },
    });
  }
  return dbPromise;
}

export async function idbIsSeeded(): Promise<boolean> {
  const db = await getDb();
  return (await db.get("meta", "seeded")) === true;
}

export async function idbMarkSeeded(): Promise<void> {
  const db = await getDb();
  await db.put("meta", true, "seeded");
}

export async function idbLoadSandboxes(): Promise<Sandbox[]> {
  const db = await getDb();
  return [...(await db.getAll("sandboxes"))];
}

export async function idbLoadEnvironments(): Promise<Environment[]> {
  const db = await getDb();
  return [...(await db.getAll("environments"))];
}

export async function idbLoadProviders(): Promise<Provider[]> {
  const db = await getDb();
  return [...(await db.getAll("providers"))];
}

export async function idbPutSandbox(sandbox: Sandbox): Promise<void> {
  const db = await getDb();
  await db.put("sandboxes", sandbox, sandbox.id);
}

export async function idbPutEnvironment(env: Environment): Promise<void> {
  const db = await getDb();
  await db.put("environments", env, env.id);
}

export async function idbPutProvider(provider: Provider): Promise<void> {
  const db = await getDb();
  await db.put("providers", provider, provider.id);
}

export async function idbDeleteSandbox(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("sandboxes", id);
}

export async function idbDeleteEnvironment(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("environments", id);
}

export async function idbDeleteProvider(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("providers", id);
}
