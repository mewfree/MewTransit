export type PackFeedInfo = {
  agency: string;
  url: string;
  etag: string;
  lastModified: string;
  feedVersion: string;
};

export type PackManifest = {
  schemaVersion: number;
  packId: string;
  civilDate: string;
  timezone: string;
  builtAt: string;
  sqliteBytes: number;
  sqliteSha256: string;
  objectKey: string;
  feeds: PackFeedInfo[];
};

const DEFAULT_PACK_MANIFEST =
  "https://mewtransit-api.dgonot.workers.dev/v1/pack/current";

export const PACK_MANIFEST_URL = (
  process.env.EXPO_PUBLIC_PACK_MANIFEST_URL ?? DEFAULT_PACK_MANIFEST
).replace(/\/$/, "");

export function packObjectUrl(manifestUrl: string, objectKey: string): string {
  const url = new URL(manifestUrl);
  if (url.hostname.endsWith("r2.dev")) {
    return `${url.origin}/${objectKey.replace(/^\//, "")}`;
  }
  const base = manifestUrl.replace(/\/current(\.json)?$/, "");
  return `${base}/objects/${objectKey.replace(/^\//, "")}`;
}

export function parseManifest(raw: unknown): PackManifest {
  if (!raw || typeof raw !== "object") {
    throw new Error("pack manifest is not an object");
  }
  const m = raw as Record<string, unknown>;
  if (m.schemaVersion !== 1) {
    throw new Error(`unsupported pack schema ${String(m.schemaVersion)}`);
  }
  if (typeof m.packId !== "string" || typeof m.civilDate !== "string") {
    throw new Error("pack manifest missing packId/civilDate");
  }
  if (typeof m.sqliteSha256 !== "string" || typeof m.objectKey !== "string") {
    throw new Error("pack manifest missing hash or objectKey");
  }
  if (typeof m.sqliteBytes !== "number") {
    throw new Error("pack manifest missing sqliteBytes");
  }
  return {
    schemaVersion: 1,
    packId: m.packId,
    civilDate: m.civilDate,
    timezone: typeof m.timezone === "string" ? m.timezone : "America/Toronto",
    builtAt: typeof m.builtAt === "string" ? m.builtAt : "",
    sqliteBytes: m.sqliteBytes,
    sqliteSha256: m.sqliteSha256.toLowerCase(),
    objectKey: m.objectKey,
    feeds: Array.isArray(m.feeds) ? (m.feeds as PackFeedInfo[]) : [],
  };
}

export async function fetchManifest(
  url: string,
  timeoutMs = 2000,
): Promise<PackManifest> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) {
      throw new Error(`manifest ${res.status} ${url}`);
    }
    return parseManifest(await res.json());
  } finally {
    clearTimeout(timer);
  }
}
