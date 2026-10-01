import { readFile } from "node:fs/promises";
import { auth } from "@clerk/nextjs/server";
import { getVideo } from "@/lib/library";
import { decodeSubtitle, findSubtitles, srtToVtt } from "@/lib/subtitles";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; track: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, track } = await params;
  const video = await getVideo(id);
  if (!video) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!/^\d+$/.test(track)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const subs = await findSubtitles(video.absPath);
  const sub = subs[Number(track)];
  if (!sub) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(sub.absPath);
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const text = decodeSubtitle(buf);
  const body =
    sub.format === "srt"
      ? srtToVtt(text)
      : text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
