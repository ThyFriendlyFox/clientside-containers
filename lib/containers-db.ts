import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  DEFAULT_SETTINGS,
  newId,
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
      upgrade(db, oldVersion) {
        // Drop pre-2.0 stores from the previous architecture if present.
        for (const name of Array.from(db.objectStoreNames)) {
          if (name !== "containers" && name !== "meta") db.deleteObjectStore(name);
        }
        if (!db.objectStoreNames.contains("containers")) db.createObjectStore("containers");
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
        void oldVersion;
      },
    });
  }
  return dbPromise;
}

function makeContainer(tier: ContainerTier, name: string, appId?: string): Container {
  return {
    id: newId(),
    name,
    tier,
    appId: tier === "app" ? appId ?? "shell" : undefined,
    status: "stopped",
    createdAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS[tier] },
  };
}

async function seedIfEmpty(db: IDBPDatabase<CscDb>): Promise<void> {
  if (await db.get("meta", "seeded")) return;
  await db.put("meta", true, "seeded");
  const seeds: Container[] = [
    makeContainer("minios", "linux-1"),
    makeContainer("app", "shell-1", "shell"),
    makeContainer("headless", "agent-1"),
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

export async function createContainer(
  tier: ContainerTier,
  name: string,
  appId?: string,
): Promise<Container> {
  const db = await getDb();
  const container = makeContainer(tier, name.trim() || tier, appId);
  await db.put("containers", container, container.id);
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
