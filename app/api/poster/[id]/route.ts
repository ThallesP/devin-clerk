import { auth } from "@clerk/nextjs/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getVideo } from "@/lib/library";
import { findPoster, posterContentType } from "@/lib/posters";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/poster/[id]">,
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const video = await getVideo(id);
  if (!video) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const posterPath = await findPoster(video.absPath);
  if (!posterPath) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  let fileStats;
  try {
    fileStats = await stat(posterPath);
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return new Response(
    Readable.toWeb(createReadStream(posterPath)) as ReadableStream,
    {
      headers: {
        "Content-Type": posterContentType(posterPath),
        "Content-Length": String(fileStats.size),
        "Cache-Control": "private, max-age=3600",
      },
    },
  );
}
