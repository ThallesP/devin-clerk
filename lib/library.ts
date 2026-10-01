import type { Stats } from "node:fs";
import { readdir, lstat, realpath, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const VIDEO_EXTENSIONS = [".mp4", ".m4v", ".webm", ".mkv", ".mov", ".avi"];

export type Video = {
  id: string;
  relPath: string;
  fileName: string;
  title: string;
  ext: string;
  size: number;
  modifiedAt: string;
};

export function getLibraryRoot(): string {
  return path.resolve(
    process.env.WATCHTIME_LIBRARY_DIR || path.join(os.homedir(), "Videos"),
  );
}

export function encodeVideoId(relPath: string): string {
  return Buffer.from(relPath).toString("base64url");
}

export function resolveInLibrary(relPath: string): string | null {
  if (
    !relPath ||
    relPath.includes("\0") ||
    path.isAbsolute(relPath) ||
    relPath.startsWith("/") ||
    relPath.startsWith("\\") ||
    /^[A-Za-z]:/.test(relPath)
  ) {
    return null;
  }

  const root = getLibraryRoot();
  const abs = path.resolve(root, relPath);
  const rel = path.relative(root, abs);

  if (
    rel === "" ||
    rel === ".." ||
    rel.startsWith(".." + path.sep) ||
    path.isAbsolute(rel)
  ) {
    return null;
  }

  return abs;
}

function toVideo(relPath: string, fileStats: Stats): Video {
  const fileName = path.basename(relPath);
  const ext = path.extname(fileName).toLowerCase();
  const title = path
    .basename(fileName, path.extname(fileName))
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    id: encodeVideoId(relPath),
    relPath,
    fileName,
    title,
    ext,
    size: fileStats.size,
    modifiedAt: fileStats.mtime.toISOString(),
  };
}

export async function scanLibrary(): Promise<Video[]> {
  const root = getLibraryRoot();
  const videos: Video[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }

      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!VIDEO_EXTENSIONS.includes(ext)) {
        continue;
      }

      try {
        const fileStats = await stat(absPath);
        const relPath = path.relative(root, absPath).split(path.sep).join("/");
        videos.push(toVideo(relPath, fileStats));
      } catch {
        continue;
      }
    }
  }

  await walk(root);
  return videos.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getVideo(
  id: string,
): Promise<(Video & { absPath: string }) | null> {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return null;
  }

  const relPath = Buffer.from(id, "base64url").toString("utf8");
  if (encodeVideoId(relPath) !== id) {
    return null;
  }

  if (relPath.split(/[\\/]/).some((segment) => segment.startsWith("."))) {
    return null;
  }

  const absPath = resolveInLibrary(relPath);
  if (!absPath) {
    return null;
  }

  try {
    const fileStats = await lstat(absPath);
    const ext = path.extname(absPath).toLowerCase();
    if (!fileStats.isFile() || !VIDEO_EXTENSIONS.includes(ext)) {
      return null;
    }

    const [realRoot, realFile] = await Promise.all([
      realpath(getLibraryRoot()),
      realpath(absPath),
    ]);
    const relativeFile = path.relative(realRoot, realFile);
    if (
      !relativeFile ||
      relativeFile === ".." ||
      relativeFile.startsWith(".." + path.sep) ||
      path.isAbsolute(relativeFile) ||
      relativeFile !== path.relative(getLibraryRoot(), absPath)
    ) {
      return null;
    }

    const posixRelPath = relPath.split(path.sep).join("/");
    return { ...toVideo(posixRelPath, fileStats), absPath };
  } catch {
    return null;
  }
}
