import { auth } from "@clerk/nextjs/server";
import { VideoCard } from "@/components/VideoCard";
import {
  getLibraryRoot,
  scanLibrary,
  VIDEO_EXTENSIONS,
} from "@/lib/library";

export default async function LibraryPage() {
  await auth.protect();
  const videos = await scanLibrary();

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Your library</h1>
        <p className="text-black/70">
          {videos.length} {videos.length === 1 ? "video" : "videos"}
        </p>
      </div>
      {videos.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              posterUrl={video.hasPoster ? `/api/poster/${video.id}` : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 px-5 py-6 text-sm">
          <h2 className="font-semibold">Your library is empty</h2>
          <p className="mt-2 text-black/70">
            WatchTime looks for videos in the folder set by{" "}
            <code>WATCHTIME_LIBRARY_DIR</code>. By default, it scans{" "}
            <code>~/Videos</code>.
          </p>
          <p className="mt-2 text-black/70">
            Current folder: <code>{getLibraryRoot()}</code>
          </p>
          <p className="mt-2 text-black/70">
            Supported extensions: {VIDEO_EXTENSIONS.join(", ")}.
          </p>
        </div>
      )}
    </section>
  );
}
