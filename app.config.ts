export type Feature = {
  title: string;
  description: string;
};

const upcomingFeatures: Feature[] = [];

export const appConfig = {
  name: "WatchTime",
  description: "A Jellyfin/Netflix alternative for watching local videos, movies and rips.",
  emoji: "🍿",
  accent: "#e11d48",
  upcomingFeatures,
};
