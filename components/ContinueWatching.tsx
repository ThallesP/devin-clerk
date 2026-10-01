import { VideoCard } from "@/components/VideoCard";
import { getVideo } from "@/lib/library";
import { listInProgress } from "@/lib/progress";

export async function ContinueWatching({ userId }: { userId: string }) {
  const entries = await listInProgress(userId);
  const items = (
    await Promise.all(
      entries.map(async (entry) => {
        const video = await getVideo(entry.videoId);
        return video ? { entry, video } : null;
      }),
    )
  ).filter((item) => item !== null);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Continue watching</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map(({ entry, video }) => (
          <div key={video.id} className="w-36 shrink-0 sm:w-40">
            <VideoCard
              video={video}
              progress={entry.position / entry.duration}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
