import { readdir } from "node:fs/promises";
import path from "node:path";

export type SubtitleFile = {
  index: number;
  absPath: string;
  lang: string;
  label: string;
  format: "srt" | "vtt";
};

export async function findSubtitles(
  videoAbsPath: string,
): Promise<SubtitleFile[]> {
  const dir = path.dirname(videoAbsPath);
  const videoName = path.basename(videoAbsPath);
  const base = path.basename(videoName, path.extname(videoName)).toLowerCase();

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const subtitles: {
    absPath: string;
    lang: string;
    label: string;
    format: "srt" | "vtt";
    fileName: string;
  }[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith(".")) {
      continue;
    }

    const name = entry.name.toLowerCase();
    const ext = path.extname(name);
    if (ext !== ".srt" && ext !== ".vtt") {
      continue;
    }

    const stem = name.slice(0, -ext.length);
    let tags: string[];
    if (stem === base) {
      tags = [];
    } else if (stem.startsWith(`${base}.`)) {
      tags = stem.slice(base.length + 1).split(".").filter(Boolean);
    } else {
      continue;
    }

    const forced = tags.includes("forced");
    const sdh = tags.some((tag) => ["sdh", "cc", "hi"].includes(tag));
    const languageTag = tags.find(
      (tag) =>
        !["forced", "sdh", "cc", "hi"].includes(tag) &&
        /^[a-z]{2,3}(-[a-z]{2}|-\d{3})?$/i.test(tag),
    );

    let lang = "und";
    if (languageTag) {
      try {
        lang = Intl.getCanonicalLocales(languageTag)[0] ?? languageTag;
      } catch {
        lang = languageTag;
      }
    }

    let label = "Subtitles";
    if (lang !== "und") {
      try {
        label =
          new Intl.DisplayNames(["en"], { type: "language" }).of(lang) ?? lang;
      } catch {
        label = lang;
      }
    }

    if (forced) {
      label += " (forced)";
    }
    if (sdh) {
      label += " (SDH)";
    }

    subtitles.push({
      absPath: path.join(dir, entry.name),
      lang,
      label,
      format: ext.slice(1) as "srt" | "vtt",
      fileName: entry.name,
    });
  }

  return subtitles
    .sort(
      (a, b) =>
        a.label.localeCompare(b.label) || a.fileName.localeCompare(b.fileName),
    )
    .map((subtitle, index) => ({
      index,
      absPath: subtitle.absPath,
      lang: subtitle.lang,
      label: subtitle.label,
      format: subtitle.format,
    }));
}

export function srtToVtt(srt: string): string {
  const normalized = srt
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/(\d{2,}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${normalized}`;
}

export function decodeSubtitle(buf: Buffer): string {
  const text = new TextDecoder("utf-8").decode(buf);
  return text.includes("\uFFFD")
    ? new TextDecoder("windows-1252").decode(buf)
    : text;
}
