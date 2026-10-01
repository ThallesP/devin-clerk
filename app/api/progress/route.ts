import { auth } from "@clerk/nextjs/server";
import { getVideo } from "@/lib/library";
import { listInProgress, saveProgress } from "@/lib/progress";

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await listInProgress(userId);
  return Response.json({ items });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const { videoId, position, duration } = body as Record<string, unknown>;
  if (
    typeof videoId !== "string" ||
    !isNonNegativeNumber(position) ||
    !isNonNegativeNumber(duration) ||
    position > duration + 1
  ) {
    return Response.json({ error: "Invalid progress" }, { status: 400 });
  }

  const video = await getVideo(videoId);
  if (!video) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await saveProgress(userId, { videoId: video.id, position, duration });
  return new Response(null, { status: 204 });
}
