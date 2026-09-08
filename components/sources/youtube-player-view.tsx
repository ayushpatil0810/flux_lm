"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

interface TranscriptItem {
  timestamp?: string;
  seconds?: number;
  text: string;
}

interface YouTubePlayerViewProps {
  url: string;
  title: string;
  content?: string | null;
}

interface YTPlayer {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementIdOrElement: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function extractYoutubeVideoId(url: string): string {
  let videoId = "";
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v") || "";
      if (!videoId && parsed.pathname.includes("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1]?.split("/")[0] || "";
      } else if (!videoId && parsed.pathname.includes("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
      }
    }
  } catch {
    // ignore
  }

  if (!videoId) {
    const match = url.match(
      /(?:youtu\.be\/|v\/|embed\/|watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/i,
    );
    videoId = match ? match[1] : "";
  }

  return videoId;
}

function formatSecondsToTimestamp(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function parseTimeStringToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function parseYoutubeTranscript(content: string): TranscriptItem[] {
  if (!content) return [];
  const lines = content.split("\n");
  const parsedLines: Array<{ rawSeconds: number | null; text: string }> = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)$/);
    if (match) {
      parsedLines.push({
        rawSeconds: parseTimeStringToSeconds(match[1]),
        text: match[2],
      });
    } else {
      parsedLines.push({
        rawSeconds: null,
        text: trimmed,
      });
    }
  }

  // Detect corrupted timestamps from legacy bug where offsets <= 100,000 ms were treated as seconds
  const timestampItems = parsedLines.filter(
    (item): item is { rawSeconds: number; text: string } =>
      item.rawSeconds !== null,
  );

  const hasDiscontinuity = timestampItems.some((item, idx) => {
    if (item.rawSeconds > 1000) {
      for (
        let j = idx + 1;
        j < Math.min(timestampItems.length, idx + 50);
        j++
      ) {
        if (
          timestampItems[j].rawSeconds < item.rawSeconds &&
          timestampItems[j].rawSeconds < 1000
        ) {
          return true;
        }
      }
    }
    return false;
  });

  const allHugeEarly =
    timestampItems.length > 1 &&
    timestampItems[0].rawSeconds === 0 &&
    timestampItems[1].rawSeconds > 1000 &&
    timestampItems[1].rawSeconds <= 100000;

  const isCorrupted = hasDiscontinuity || allHugeEarly;

  return parsedLines.map((item) => {
    if (item.rawSeconds === null) {
      return { text: item.text };
    }

    let actualSeconds = item.rawSeconds;
    if (isCorrupted && item.rawSeconds >= 1000 && item.rawSeconds <= 100000) {
      actualSeconds = Math.round(item.rawSeconds / 1000);
    }

    return {
      timestamp: formatSecondsToTimestamp(actualSeconds),
      seconds: actualSeconds,
      text: item.text,
    };
  });
}

// ── API Script Loader ───────────────────────────────────────────────────────

let apiPromise: Promise<void> | null = null;

function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();

  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        resolve();
      };

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]',
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });
  }

  return apiPromise;
}

// ── Component ───────────────────────────────────────────────────────────────

export function YouTubePlayerView({
  url,
  title,
  content,
}: YouTubePlayerViewProps) {
  const videoId = React.useMemo(() => extractYoutubeVideoId(url), [url]);
  const transcript = React.useMemo(
    () => (content ? parseYoutubeTranscript(content) : []),
    [content],
  );

  const containerId = React.useId().replace(/:/g, "_");
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const playerRef = React.useRef<YTPlayer | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [apiReady, setApiReady] = React.useState(false);
  const [fallbackSeekSeconds, setFallbackSeekSeconds] = React.useState<
    number | null
  >(null);

  // Load YouTube Iframe API
  React.useEffect(() => {
    let mounted = true;
    loadYouTubeIframeAPI().then(() => {
      if (mounted) setApiReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize YT.Player
  React.useEffect(() => {
    if (!apiReady || !videoId || !playerContainerRef.current) return;

    let isCancelled = false;

    // Clear existing player
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        // ignore
      }
      playerRef.current = null;
    }

    const elementId = `yt-embed-${containerId}`;
    const targetDiv = document.createElement("div");
    targetDiv.id = elementId;
    targetDiv.className = "h-full w-full border-0";
    playerContainerRef.current.innerHTML = "";
    playerContainerRef.current.appendChild(targetDiv);

    try {
      const player = new window.YT!.Player(elementId, {
        videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
          origin:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
        events: {
          onReady: (event) => {
            if (!isCancelled) {
              playerRef.current = event.target;
            }
          },
          onStateChange: (event) => {
            if (isCancelled) return;
            const state = event.data;
            if (state === 1) {
              // PLAYING
              setIsPlaying(true);
            } else {
              // PAUSED, ENDED, BUFFERING, etc.
              setIsPlaying(false);
            }
          },
        },
      });
    } catch {
      // Fallback will render if player initialization fails
    }

    return () => {
      isCancelled = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [apiReady, videoId, containerId]);

  // Polling playback time when playing
  React.useEffect(() => {
    if (isPlaying && playerRef.current) {
      timerRef.current = setInterval(() => {
        try {
          if (playerRef.current) {
            const t = playerRef.current.getCurrentTime();
            if (typeof t === "number" && !isNaN(t)) {
              setCurrentTime(t);
            }
          }
        } catch {
          // ignore
        }
      }, 250);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying]);

  // Determine active transcript item index
  const activeIndex = React.useMemo(() => {
    if (transcript.length === 0) return -1;

    let candidate = -1;
    for (let i = 0; i < transcript.length; i++) {
      const sec = transcript[i].seconds;
      if (typeof sec === "number") {
        if (currentTime >= sec) {
          candidate = i;
        } else {
          break;
        }
      }
    }
    return candidate;
  }, [transcript, currentTime]);

  // Auto-scroll active item within transcript container only (never scrolling parent or video)
  React.useEffect(() => {
    if (activeIndex >= 0 && isPlaying && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const el = itemRefs.current.get(activeIndex);
      if (el) {
        const elTop = el.offsetTop;
        const targetScrollTop = elTop - Math.floor(container.clientHeight * 0.35);

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth",
        });
      }
    }
  }, [activeIndex, isPlaying]);

  // Seek handler
  const handleSeek = React.useCallback((seconds: number) => {
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(seconds, true);
        playerRef.current.playVideo();
        setCurrentTime(seconds);
        return;
      } catch {
        // ignore
      }
    }
    setFallbackSeekSeconds(seconds);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 p-3 overflow-hidden">
      {/* Video Player Container */}
      <div className="shrink-0 aspect-video w-full overflow-hidden rounded-xl bg-black shadow-xs relative">
        <div ref={playerContainerRef} className="h-full w-full" />

        {/* Fallback iframe if API not ready or player unavailable */}
        {!apiReady && (
          <iframe
            src={
              videoId
                ? `https://www.youtube.com/embed/${videoId}${
                    fallbackSeekSeconds !== null
                      ? `?start=${Math.floor(fallbackSeekSeconds)}&autoplay=1`
                      : ""
                  }`
                : url
            }
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>

      {/* Transcript Section */}
      {transcript.length > 0 && (
        <div className="mt-3.5 border-t border-border/50 pt-3 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="mb-2.5 shrink-0 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Transcript
            </span>
          </div>

          <div
            ref={scrollContainerRef}
            className="relative flex-1 min-h-0 overflow-y-auto pr-1 no-scrollbar space-y-1"
          >
            {transcript.map((item, index) => {
              const isActive = index === activeIndex;

              return (
                <div
                  key={index}
                  ref={(el) => {
                    if (el) itemRefs.current.set(index, el);
                    else itemRefs.current.delete(index);
                  }}
                  onClick={() => {
                    if (typeof item.seconds === "number") {
                      handleSeek(item.seconds);
                    }
                  }}
                  className={cn(
                    "group relative flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer select-text",
                    isActive
                      ? "opacity-100 bg-muted/40"
                      : isPlaying
                        ? "opacity-40 hover:opacity-85 hover:bg-muted/20"
                        : "opacity-80 hover:opacity-100 hover:bg-muted/20",
                  )}
                >
                  {/* Subtle active left accent indicator */}
                  <div
                    className={cn(
                      "absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full transition-all duration-200",
                      isActive
                        ? "bg-primary scale-y-100 opacity-100"
                        : "bg-transparent scale-y-0 opacity-0",
                    )}
                    aria-hidden
                  />

                  {item.timestamp ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (typeof item.seconds === "number") {
                          handleSeek(item.seconds);
                        }
                      }}
                      title={`Jump to ${item.timestamp}`}
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-medium transition-colors select-none",
                        isActive
                          ? "text-primary font-semibold bg-primary/10"
                          : "text-muted-foreground/60 group-hover:text-foreground bg-muted/40 group-hover:bg-muted/70",
                      )}
                    >
                      {item.timestamp}
                    </button>
                  ) : null}

                  <p
                    className={cn(
                      "flex-1 text-xs leading-relaxed transition-colors",
                      isActive
                        ? "text-foreground font-medium"
                        : "text-foreground/80 font-normal",
                    )}
                  >
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
