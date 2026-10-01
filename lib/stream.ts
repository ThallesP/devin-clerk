import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { parseRange } from "@/lib/range";

export const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

export function streamFile(
  absPath: string,
  size: number,
  ext: string,
  rangeHeader: string | null,
): Response {
  const headers: Record<string, string> = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
  };

  const range = parseRange(rangeHeader, size);

  if (range === "invalid") {
    return new Response(null, {
      status: 416,
      headers: { ...headers, "Content-Range": `bytes */${size}` },
    });
  }

  if (range === null) {
    return new Response(
      Readable.toWeb(createReadStream(absPath)) as ReadableStream,
      {
        status: 200,
        headers: { ...headers, "Content-Length": String(size) },
      },
    );
  }

  const { start, end } = range;
  return new Response(
    Readable.toWeb(createReadStream(absPath, { start, end })) as ReadableStream,
    {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    },
  );
}
