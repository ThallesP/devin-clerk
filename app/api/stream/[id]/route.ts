import { auth } from "@clerk/nextjs/server";
import { getVideo } from "@/lib/library";
import { streamFile } from "@/lib/stream";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await getVideo(id);
  if (!video) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return streamFile(
    video.absPath,
    video.size,
    video.ext,
    request.headers.get("range"),
  );
}
