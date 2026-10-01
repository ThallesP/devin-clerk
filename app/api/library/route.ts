import { auth } from "@clerk/nextjs/server";
import { scanLibrary } from "@/lib/library";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ videos: await scanLibrary() });
}
