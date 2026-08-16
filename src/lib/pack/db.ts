import { Directory, File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import { META_SQL } from "./queries";
import type { PackManifest } from "./manifest";

export type PackMeta = {
  schemaVersion: string;
  packId: string;
  civilDate: string;
  timezone: string;
  builtAt: string;
};

let db: SQLite.SQLiteDatabase | null = null;
let meta: PackMeta | null = null;

export function packDir(): Directory {
  return new Directory(Paths.cache, "packs", "montreal");
}

export function packFiles() {
  const dir = packDir();
  return {
    dir,
    active: new File(dir, "pack.db"),
    download: new File(dir, "pack.db.download"),
    prev: new File(dir, "pack.db.prev"),
    manifest: new File(dir, "current.json"),
  };
}

export function isPackOpen(): boolean {
  return db !== null && meta !== null;
}

export function getPackDb(): SQLite.SQLiteDatabase | null {
  return db;
}

export function getPackMeta(): PackMeta | null {
  return meta;
}

export function packSource(): string | null {
  return meta ? `pack:${meta.civilDate}` : null;
}

export async function closePack(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  meta = null;
}

export async function openActivePack(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { dir, active } = packFiles();
  if (!dir.exists || !active.exists) return false;
  return openPackFile(active);
}

export async function openPackFile(file: File): Promise<boolean> {
  if (Platform.OS === "web") return false;
  await closePack();
  try {
    const opened = await SQLite.openDatabaseAsync("pack.db", undefined, packDir().uri);
    const rows = await opened.getAllAsync<{ key: string; value: string }>(META_SQL);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    if (!map.schema_version || !map.civil_date || !map.pack_id) {
      await opened.closeAsync();
      return false;
    }
    db = opened;
    meta = {
      schemaVersion: map.schema_version,
      packId: map.pack_id,
      civilDate: map.civil_date,
      timezone: map.timezone ?? "America/Toronto",
      builtAt: map.built_at ?? "",
    };
    void file;
    return true;
  } catch {
    db = null;
    meta = null;
    return false;
  }
}

export function localManifest(): PackManifest | null {
  if (Platform.OS === "web") return null;
  const { manifest } = packFiles();
  if (!manifest.exists) return null;
  try {
    return JSON.parse(manifest.textSync()) as PackManifest;
  } catch {
    return null;
  }
}
