import { appConfig } from "@/app.config";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ features: appConfig.upcomingFeatures });
}
