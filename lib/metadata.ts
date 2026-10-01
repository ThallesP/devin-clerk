import path from "node:path";

function cleanTitle(value: string): string {
  let cleaned = value.replace(/\s+/g, " ").trim();
  let previous: string;

  do {
    previous = cleaned;
    cleaned = cleaned.replace(/^[\-(\s]+|[-(\s]+$/g, "").trim();
  } while (cleaned !== previous);

  return cleaned;
}

const releaseTags = [
  "2160p",
  "1080p",
  "720p",
  "480p",
  "4k",
  "uhd",
  "hdr",
  "bluray",
  "brrip",
  "bdrip",
  "webrip",
  "web-dl",
  "webdl",
  "hdrip",
  "dvdrip",
  "hdtv",
  "x264",
  "x265",
  "h264",
  "h265",
  "hevc",
  "aac",
  "ac3",
  "dts",
  "remux",
  "proper",
  "repack",
  "extended",
  "unrated",
  "yify",
  "yts",
  "rarbg",
];

const releaseTagPattern = new RegExp(
  `(^|[\\s()\\-])(${releaseTags
    .sort((a, b) => b.length - a.length)
    .map((tag) => tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})(?=$|[\\s\\-()])`,
  "i",
);

export function parseFileName(
  fileName: string,
): { title: string; year?: number } {
  const extension = path.extname(fileName);
  const raw = extension ? fileName.slice(0, -extension.length) : fileName;
  const source = raw.replace(/[._]/g, " ").replace(/\[[^\]]*\]/g, "");

  let yearIndex = -1;
  let year: number | undefined;

  for (let index = 0; index <= source.length - 4; index += 1) {
    const candidate = source.slice(index, index + 4);
    if (!/^(?:19|20)\d{2}$/.test(candidate)) {
      continue;
    }

    const before = source[index - 1];
    const after = source[index + 4];
    if (
      (before !== undefined && !/[\s(]/.test(before)) ||
      (after !== undefined && !/[\s)]/.test(after)) ||
      !cleanTitle(source.slice(0, index))
    ) {
      continue;
    }

    yearIndex = index;
    year = Number(candidate);
  }

  if (yearIndex !== -1) {
    const title = cleanTitle(source.slice(0, yearIndex));
    return title ? { title, year } : { title: raw || fileName, year };
  }

  const releaseTag = releaseTagPattern.exec(source);
  const title = cleanTitle(
    releaseTag
      ? source.slice(0, releaseTag.index + releaseTag[1].length)
      : source,
  );

  return { title: title || raw || fileName };
}
