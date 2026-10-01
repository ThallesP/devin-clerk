import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { getLibraryRoot } from "@/lib/library";

const imageExtensions = ["jpg", "jpeg", "png", "webp"];

export async function findPoster(videoAbsPath: string): Promise<string | null> {
  const dir = path.dirname(videoAbsPath);
  const base = path.basename(videoAbsPath, path.extname(videoAbsPath));

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }

  const names = new Map<string, string>();
  for (const name of entries) {
    if (!name.startsWith(".")) {
      names.set(name.toLowerCase(), name);
    }
  }

  const candidates = [
    ...imageExtensions.map((extension) => `${base}.${extension}`),
    ...imageExtensions.map((extension) => `${base}-poster.${extension}`),
  ];

  if (path.resolve(dir) !== getLibraryRoot()) {
    for (const name of ["poster", "folder", "cover"]) {
      candidates.push(
        ...imageExtensions.map((extension) => `${name}.${extension}`),
      );
    }
  }

  for (const candidate of candidates) {
    const realName = names.get(candidate.toLowerCase());
    if (!realName) {
      continue;
    }

    const posterPath = path.resolve(dir, realName);
    try {
      if ((await lstat(posterPath)).isFile()) {
        return posterPath;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function posterContentType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
