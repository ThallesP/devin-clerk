import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export type ProgressEntry = {
  videoId: string;
  position: number;
  duration: number;
  updatedAt: string;
};

type ProgressStore = Record<string, Record<string, ProgressEntry>>;

const MIN_POSITION_SECONDS = 10;
const FINISHED_RATIO = 0.95;

function getDataDir(): string {
  return (
    process.env.WATCHTIME_DATA_DIR || path.join(process.cwd(), ".watchtime")
  );
}

function getProgressFile(): string {
  return path.join(getDataDir(), "progress.json");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEntry(value: unknown): value is ProgressEntry {
  return (
    isRecord(value) &&
    typeof value.videoId === "string" &&
    typeof value.position === "number" &&
    Number.isFinite(value.position) &&
    typeof value.duration === "number" &&
    Number.isFinite(value.duration) &&
    typeof value.updatedAt === "string"
  );
}

async function readStore(): Promise<ProgressStore> {
  const store: ProgressStore = Object.create(null);
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(getProgressFile(), "utf8"));
  } catch {
    return store;
  }
  if (!isRecord(parsed)) {
    return store;
  }

  for (const [userId, entries] of Object.entries(parsed)) {
    if (!isRecord(entries)) {
      continue;
    }
    const userEntries: Record<string, ProgressEntry> = Object.create(null);
    for (const [videoId, entry] of Object.entries(entries)) {
      if (isEntry(entry)) {
        userEntries[videoId] = entry;
      }
    }
    store[userId] = userEntries;
  }
  return store;
}

async function writeStore(store: ProgressStore): Promise<void> {
  const file = getProgressFile();
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(store), "utf8");
    await rename(tmp, file);
  } catch (error) {
    await rm(tmp, { force: true });
    throw error;
  }
}

let writeChain: Promise<unknown> = Promise.resolve();

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const result = writeChain.then(task, task);
  writeChain = result.catch(() => {});
  return result;
}

export function isFinished(entry: ProgressEntry): boolean {
  return entry.position >= entry.duration * FINISHED_RATIO;
}

export async function getProgress(
  userId: string,
  videoId: string,
): Promise<ProgressEntry | null> {
  const store = await readStore();
  return store[userId]?.[videoId] ?? null;
}

export async function listInProgress(
  userId: string,
  limit = 12,
): Promise<ProgressEntry[]> {
  const store = await readStore();
  return Object.values(store[userId] ?? {})
    .filter(
      (entry) => entry.position >= MIN_POSITION_SECONDS && !isFinished(entry),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);
}

export async function saveProgress(
  userId: string,
  {
    videoId,
    position,
    duration,
  }: { videoId: string; position: number; duration: number },
): Promise<void> {
  await enqueueWrite(async () => {
    const store = await readStore();
    const userEntries = store[userId] ?? Object.create(null);
    userEntries[videoId] = {
      videoId,
      position,
      duration,
      updatedAt: new Date().toISOString(),
    };
    store[userId] = userEntries;
    await writeStore(store);
  });
}
