import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  buildContainer,
  type Container,
  type ContainerSettings,
  type ContainerTier,
} from "./container";

const DB_NAME = "clientside-containers";
const DB_VERSION = 2;

interface CscDb extends DBSchema {
  containers: { key: string; value: Container };
  meta: { key: string; value: boolean };
}

let dbPromise: Promise<IDBPDatabase<CscDb>> | null = null;

function getDb(): Promise<IDBPDatabase<CscDb>> {
  if (!dbPromise) {
    dbPromise = openDB<CscDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Start from a clean schema: the pre-2.0 architecture stored unrelated
        // sandbox/environment data and a `seeded` flag that would suppress the
        // new default containers. Drop everything and recreate.
        for (const name of Array.from(db.objectStoreNames)) {
          db.deleteObjectStore(name);
        }
        db.createObjectStore("containers");
        db.createObjectStore("meta");
      },
      // Another tab holds an older-version connection open: ask it to close so
      // our upgrade isn't blocked indefinitely.
      blocked() {
        console.warn("clientside-containers: IndexedDB upgrade blocked by another tab");
      },
      blocking() {
        void dbPromise?.then((db) => db.close()).catch(() => {});
        dbPromise = null;
      },
      terminated() {
        dbPromise = null;
      },
    }).catch((err) => {
      // Don't cache a rejected promise — let the next call retry.
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

async function seedIfEmpty(db: IDBPDatabase<CscDb>): Promise<void> {
  if (await db.get("meta", "seeded")) return;
  await db.put("meta", true, "seeded");
  const seeds: Container[] = [
    buildContainer("agent", undefined, "agent-1"),
    buildContainer("app", "shell", "shell-1"),
    buildContainer("minios", undefined, "linux-1"),
  ];
  const tx = db.transaction("containers", "readwrite");
  await Promise.all(seeds.map((c) => tx.store.put(c, c.id)));
  await tx.done;
}

export async function listContainers(): Promise<Container[]> {
  const db = await getDb();
  await seedIfEmpty(db);
  const all = await db.getAll("containers");
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Persist an already-built container (used by the optimistic UI). */
export async function persistContainer(container: Container): Promise<void> {
  const db = await getDb();
  await db.put("containers", container, container.id);
}

export async function createContainer(
  tier: ContainerTier,
  appId?: string,
  name?: string,
): Promise<Container> {
  const container = buildContainer(tier, appId, name);
  await persistContainer(container);
  return container;
}

export async function saveContainer(container: Container): Promise<void> {
  const db = await getDb();
  await db.put("containers", container, container.id);
}

export async function updateSettings(
  id: string,
  settings: Partial<ContainerSettings>,
  name?: string,
): Promise<Container | null> {
  const db = await getDb();
  const existing = await db.get("containers", id);
  if (!existing) return null;
  const updated: Container = {
    ...existing,
    name: name?.trim() || existing.name,
    settings: { ...existing.settings, ...settings },
  };
  await db.put("containers", updated, id);
  return updated;
}

export async function setStatus(id: string, status: Container["status"]): Promise<void> {
  const db = await getDb();
  const existing = await db.get("containers", id);
  if (!existing) return;
  await db.put("containers", { ...existing, status }, id);
}

export async function deleteContainer(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("containers", id);
}
