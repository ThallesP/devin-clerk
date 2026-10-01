export type Feature = {
  title: string;
  description: string;
};

export const appConfig = {
  name: "WatchTime",
  description: "A Jellyfin/Netflix alternative for watching local videos, movies and rips.",
  emoji: "🍿",
  accent: "#e11d48",
  upcomingFeatures: [
    {
      title: "Library folder scan",
      description: "Point WatchTime at a folder and it lists every video file it finds.",
    },
    {
      title: "Posters and movie info",
      description: "Show the title, year and poster art for each movie in your library.",
    },
    {
      title: "In-browser player",
      description: "Play any video in the browser with seeking, volume and fullscreen.",
    },
    {
      title: "Continue watching",
      description: "Pick up every movie right where you stopped watching it.",
    },
    {
      title: "Subtitle support",
      description: "Load .srt or .vtt subtitle files that sit next to a video.",
    },
  ] satisfies Feature[],
};
