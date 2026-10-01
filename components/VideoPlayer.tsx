"use client";

import { useEffect, useRef } from "react";

export type SubtitleTrack = { src: string; label: string; lang: string };

export type VideoPlayerProps = {
  videoId: string;
  src: string;
  title: string;
  tracks?: SubtitleTrack[];
  startAt?: number;
  progressEndpoint?: string;
};

export function VideoPlayer({
  videoId,
  src,
  title,
  tracks,
  startAt,
  progressEndpoint,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const didSeekRef = useRef(false);
  const hasPlayedRef = useRef(false);
  const lastSentAtRef = useRef(0);
  const lastPositionRef = useRef<number | null>(null);
  const propsRef = useRef({ videoId, progressEndpoint });
  useEffect(() => {
    propsRef.current = { videoId, progressEndpoint };
  }, [videoId, progressEndpoint]);

  function readProgress() {
    const video = videoRef.current;
    if (!video) {
      return null;
    }
    const { currentTime, duration } = video;
    if (!Number.isFinite(duration) || duration <= 0) {
      return null;
    }
    return {
      videoId: propsRef.current.videoId,
      position: currentTime,
      duration,
    };
  }

  function sendProgress(force: boolean) {
    const endpoint = propsRef.current.progressEndpoint;
    if (!endpoint) {
      return;
    }
    const body = readProgress();
    if (!body) {
      return;
    }
    if (!force && Date.now() - lastSentAtRef.current < 10_000) {
      return;
    }
    if (lastPositionRef.current === body.position) {
      return;
    }
    lastSentAtRef.current = Date.now();
    lastPositionRef.current = body.position;
    try {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  useEffect(() => {
    function onPageHide() {
      const endpoint = propsRef.current.progressEndpoint;
      if (!endpoint || !hasPlayedRef.current) {
        return;
      }
      const body = readProgress();
      if (!body || lastPositionRef.current === body.position) {
        return;
      }
      try {
        navigator.sendBeacon(
          endpoint,
          new Blob([JSON.stringify(body)], { type: "application/json" }),
        );
        lastSentAtRef.current = Date.now();
        lastPositionRef.current = body.position;
      } catch {}
    }

    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        preload="metadata"
        src={src}
        aria-label={title}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (
            video &&
            !didSeekRef.current &&
            startAt &&
            startAt > 0 &&
            startAt < video.duration - 5
          ) {
            didSeekRef.current = true;
            video.currentTime = startAt;
          }
        }}
        onPlay={() => {
          hasPlayedRef.current = true;
        }}
        onTimeUpdate={() => sendProgress(false)}
        onPause={() => sendProgress(true)}
        onEnded={() => sendProgress(true)}
      >
        {tracks?.map((t) => (
          <track
            key={t.src}
            kind="subtitles"
            src={t.src}
            label={t.label}
            srcLang={t.lang}
          />
        ))}
      </video>
    </div>
  );
}
