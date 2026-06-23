"use client";

import { useCallback, useEffect, useState } from "react";
import { Logo } from "./Logo";
import { ContainerCard } from "./ContainerCard";
import { ContainerStage } from "./ContainerStage";
import { SettingsModal } from "./SettingsModal";
import { NewContainerMenu } from "./NewContainerMenu";
import {
  createContainer,
  deleteContainer,
  listContainers,
  setStatus,
  updateSettings,
} from "@/lib/containers-db";
import { newId, type Container, type ContainerSettings, type ContainerTier } from "@/lib/container";

export function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setContainers(await listContainers());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, [refresh]);

  const open = containers.find((c) => c.id === openId) ?? null;
  const settings = containers.find((c) => c.id === settingsId) ?? null;

  function patchLocal(id: string, patch: Partial<Container>) {
    setContainers((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function handleCreate(tier: ContainerTier, appId?: string) {
    const prefix = tier === "minios" ? "linux" : tier === "app" ? appId ?? "app" : "agent";
    const created = await createContainer(tier, `${prefix}-${newId("").slice(1, 4)}`, appId);
    setCreating(false);
    setContainers((prev) => [...prev, created]);
    setOpenId(created.id);
  }

  async function handleSaveSettings(id: string, name: string, next: Partial<ContainerSettings>) {
    const updated = await updateSettings(id, next, name);
    if (updated) patchLocal(id, { name: updated.name, settings: updated.settings });
    setSettingsId(null);
  }

  async function handleDelete(id: string) {
    await deleteContainer(id);
    setContainers((prev) => prev.filter((c) => c.id !== id));
    setSettingsId(null);
    if (openId === id) setOpenId(null);
  }

  function handleStatus(id: string, status: Container["status"]) {
    patchLocal(id, { status });
    void setStatus(id, status);
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Logo />
          <button type="button" onClick={() => setCreating(true)} className="btn-primary text-sm">
            + New container
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <p className="py-20 text-center text-sm text-zinc-500">Loading containers…</p>
        ) : containers.length === 0 ? (
          <div className="card flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-zinc-400">No containers yet.</p>
            <button type="button" onClick={() => setCreating(true)} className="btn-primary text-sm">
              + New container
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {containers.map((c) => (
              <ContainerCard
                key={c.id}
                container={c}
                onOpen={() => setOpenId(c.id)}
                onSettings={() => setSettingsId(c.id)}
              />
            ))}
          </div>
        )}
      </main>

      {open && (
        <ContainerStage
          container={open}
          onClose={() => setOpenId(null)}
          onStatus={(s) => handleStatus(open.id, s)}
        />
      )}

      {settings && (
        <SettingsModal
          container={settings}
          onSave={(name, next) => handleSaveSettings(settings.id, name, next)}
          onDelete={() => handleDelete(settings.id)}
          onClose={() => setSettingsId(null)}
        />
      )}

      {creating && <NewContainerMenu onCreate={handleCreate} onClose={() => setCreating(false)} />}
    </div>
  );
}
