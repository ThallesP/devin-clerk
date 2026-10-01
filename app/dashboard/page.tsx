import Link from "next/link";
import { appConfig } from "@/app.config";
import { ContinueWatching } from "@/components/ContinueWatching";
import { FeatureCard } from "@/components/FeatureCard";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  await auth.protect();
  const { userId } = await auth();
  const user = await currentUser();
  const displayName =
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "there";
  const [nextFeature] = appConfig.upcomingFeatures;

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <span className="text-4xl" aria-hidden>
          {appConfig.emoji}
        </span>
        <h1 className="text-3xl font-bold">Welcome, {displayName}!</h1>
        <p className="text-lg text-black/70">
          Your movies and rips are ready to watch in {appConfig.name}.
        </p>
      </div>
      <Link
        href="/library"
        className="w-fit rounded-full bg-accent px-6 py-3 font-medium text-white shadow-sm transition hover:opacity-90"
      >
        Open your library →
      </Link>
      {userId && <ContinueWatching userId={userId} />}
      {nextFeature ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {appConfig.upcomingFeatures.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
          <div className="rounded-2xl border border-dashed border-accent/40 bg-accent/5 px-5 py-4 text-sm">
            <strong className="text-accent">Keep building:</strong> open Devin
            and ask it to &ldquo;Build &lsquo;{nextFeature.title}&rsquo; from
            the Coming soon page.&rdquo;
          </div>
        </>
      ) : (
        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Everything on the roadmap is live</h2>
          <p className="mt-1 text-sm text-black/70">
            Library scan, posters, the player, resume and subtitles have all
            shipped.
          </p>
        </article>
      )}
    </section>
  );
}
