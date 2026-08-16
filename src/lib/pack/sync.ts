import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import { Platform } from "react-native";

import {
  fetchManifest,
  PACK_MANIFEST_URL,
  packObjectUrl,
  parseManifest,
  type PackManifest,
} from "./manifest";
import {
  closePack,
  localManifest,
  openActivePack,
  openPackFile,
  packFiles,
} from "./db";

export type PackSyncProgress = {
  phase: "idle" | "checking" | "downloading" | "ready" | "error";
  message: string;
  bytesWritten?: number;
  totalBytes?: number;
};

export type PackSyncResult = {
  opened: boolean;
  updated: boolean;
  error?: string;
};

function hexSha256(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256File(file: File): Promise<string> {
  const bytes = await file.bytes();
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
  return hexSha256(digest);
}

function ensureDir(): void {
  const { dir } = packFiles();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
}

function writeLocalManifest(manifest: PackManifest): void {
  const { manifest: file } = packFiles();
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(manifest));
}

function swapDownloadIntoPlace(): File {
  const { active, download, prev } = packFiles();
  if (prev.exists) prev.delete();
  if (active.exists) active.move(prev);
  download.move(active);
  return active;
}

async function rollbackPrev(): Promise<boolean> {
  const { active, prev } = packFiles();
  await closePack();
  if (active.exists) active.delete();
  if (!prev.exists) return false;
  prev.move(active);
  return openPackFile(active);
}

export async function syncPack(
  onProgress?: (p: PackSyncProgress) => void,
): Promise<PackSyncResult> {
  if (Platform.OS === "web" || !PACK_MANIFEST_URL) {
    return { opened: false, updated: false };
  }

  ensureDir();
  const hadPack = await openActivePack();
  const current = localManifest();

  onProgress?.({
    phase: "checking",
    message: hadPack ? "Checking for a newer pack…" : "Looking up city pack…",
  });

  let remote: PackManifest;
  try {
    remote = await fetchManifest(PACK_MANIFEST_URL);
  } catch (err) {
    if (hadPack) {
      onProgress?.({ phase: "ready", message: "" });
      return { opened: true, updated: false };
    }
    const message = err instanceof Error ? err.message : "pack manifest failed";
    onProgress?.({ phase: "error", message: "Couldn't download the city pack." });
    return { opened: false, updated: false, error: message };
  }

  if (
    current &&
    current.sqliteSha256 === remote.sqliteSha256 &&
    current.civilDate === remote.civilDate &&
    hadPack
  ) {
    onProgress?.({ phase: "ready", message: "" });
    return { opened: true, updated: false };
  }

  const { download } = packFiles();
  if (download.exists) download.delete();

  const objectUrl = packObjectUrl(PACK_MANIFEST_URL, remote.objectKey);
  onProgress?.({
    phase: "downloading",
    message: hadPack ? "Updating city pack…" : "Downloading city pack…",
    bytesWritten: 0,
    totalBytes: remote.sqliteBytes,
  });

  try {
    const task = File.createDownloadTask(objectUrl, download, {
      onProgress: ({ bytesWritten, totalBytes }) => {
        const total = totalBytes > 0 ? totalBytes : remote.sqliteBytes;
        const pct = total > 0 ? Math.min(99, Math.round((bytesWritten / total) * 100)) : 0;
        onProgress?.({
          phase: "downloading",
          message: `Downloading city pack ${pct}%`,
          bytesWritten,
          totalBytes: total,
        });
      },
    });
    const file = await task.downloadAsync();
    if (!file || !download.exists) {
      throw new Error("download produced no file");
    }
    const hash = await sha256File(download);
    if (hash !== remote.sqliteSha256) {
      download.delete();
      throw new Error("pack hash mismatch");
    }
    const active = swapDownloadIntoPlace();
    writeLocalManifest(remote);
    const opened = await openPackFile(active);
    if (!opened) {
      const restored = await rollbackPrev();
      throw new Error(restored ? "new pack failed to open; restored previous" : "pack failed to open");
    }
    onProgress?.({ phase: "ready", message: "" });
    return { opened: true, updated: true };
  } catch (err) {
    if (download.exists) {
      try {
        download.delete();
      } catch {
        // ignore
      }
    }
    if (hadPack) {
      await openActivePack();
      onProgress?.({ phase: "ready", message: "" });
      return { opened: true, updated: false };
    }
    const message = err instanceof Error ? err.message : "pack download failed";
    onProgress?.({ phase: "error", message: "Couldn't download the city pack." });
    return { opened: false, updated: false, error: message };
  }
}

export function readCachedManifest(): PackManifest | null {
  const raw = localManifest();
  if (!raw) return null;
  try {
    return parseManifest(raw);
  } catch {
    return null;
  }
}
