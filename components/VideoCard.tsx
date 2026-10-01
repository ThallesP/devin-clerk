import Link from "next/link";
import type { Video } from "@/lib/library";

function titleHue(title: string): number {
  let hash = 2166136261;
  for (let index = 0; index < title.length; index += 1) {
    hash ^= title.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

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
  const hue = titleHue(video.title);

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
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center text-white"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 65% 45%), hsl(${(hue + 40) % 360} 70% 18%))`,
            }}
          >
            <span className="line-clamp-4 text-2xl font-bold leading-tight">
              {video.title}
            </span>
            {video.year !== undefined && (
              <span className="text-sm text-white/70">{video.year}</span>
            )}
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
        {video.year !== undefined && (
          <span className="font-normal text-black/50"> {video.year}</span>
        )}
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
