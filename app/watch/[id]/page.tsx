import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getVideo } from "@/lib/library";
import { findSubtitles } from "@/lib/subtitles";

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

const LIMITED_SUPPORT_EXTENSIONS = [".mkv", ".avi", ".mov"];

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect();
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) {
    notFound();
  }
  const subs = await findSubtitles(video.absPath);

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12">
      <Link href="/library" className="text-sm hover:text-accent">
        ← Library
      </Link>
      <h1 className="text-3xl font-bold">{video.title}</h1>
      {LIMITED_SUPPORT_EXTENSIONS.includes(video.ext) && (
        <div className="rounded-xl border border-accent/40 bg-accent/5 px-4 py-3 text-sm">
          This format may not play in every browser. MP4 or WebM work best.
        </div>
      )}
      <VideoPlayer
        videoId={video.id}
        src={`/api/stream/${video.id}`}
        title={video.title}
        tracks={subs.map((s) => ({
          src: `/api/subtitles/${video.id}/${s.index}`,
          label: s.label,
          lang: s.lang,
        }))}
      />
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 font-medium text-black/60">File name</dt>
          <dd>{video.fileName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 font-medium text-black/60">Size</dt>
          <dd>{formatSize(video.size)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 font-medium text-black/60">Path</dt>
          <dd>
            <code>{video.relPath}</code>
          </dd>
        </div>
        {subs.length > 0 && (
          <div className="flex gap-2">
            <dt className="w-24 font-medium text-black/60">Subtitles</dt>
            <dd>
              {subs.length} subtitle track{subs.length === 1 ? "" : "s"}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
