import Link from "next/link";
import type { Video } from "@/lib/library";

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes.toFixed(1)} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function VideoCard({
  video,
  posterUrl,
  progress,
}: {
  video: Video;
  posterUrl?: string;
  progress?: number;
}) {
  const progressPercent =
    typeof progress === "number"
      ? Math.max(0, Math.min(1, progress)) * 100
      : null;

  return (
    <Link href={`/watch/${video.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-neutral-800 to-neutral-950 px-4 text-center text-white">
            <span className="text-4xl" aria-hidden>
              🎬
            </span>
            <span className="line-clamp-3 font-medium">{video.title}</span>
          </div>
        )}
        {progressPercent !== null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
            <div
              className="h-full bg-accent"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
      <h2 className="line-clamp-2 font-semibold group-hover:text-accent">
        {video.title}
      </h2>
      <div className="flex items-center gap-2 text-xs text-black/60">
        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium uppercase text-accent">
          {video.ext.slice(1)}
        </span>
        <span>{formatSize(video.size)}</span>
      </div>
    </Link>
  );
}
