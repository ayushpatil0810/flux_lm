"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { Source } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PptSlide {
  slideNumber: number;
  title: string;
  bullets: string[];
}

interface PptSlideViewProps {
  source: Source;
}

/**
 * Fallback parser that breaks raw text into slide blocks if structured metadata is missing.
 */
function parseRawContentToSlides(content: string): PptSlide[] {
  if (!content || !content.trim()) return [];

  const blocks = content.split(/(?=^###\s+Slide\s+\d+)/m).filter(Boolean);

  if (blocks.length <= 1) {
    const paragraphs = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) return [];

    return paragraphs.map((para, idx) => {
      const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
      const title = lines[0]?.replace(/^[#•\-\*]+\s*/, "") || `Slide ${idx + 1}`;
      const bullets = lines
        .slice(1)
        .map((l) => l.replace(/^[•\-\*]+\s*/, "").trim())
        .filter(Boolean);

      return {
        slideNumber: idx + 1,
        title,
        bullets,
      };
    });
  }

  return blocks.map((block, idx) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    let title = `Slide ${idx + 1}`;
    let bullets: string[] = [];

    if (lines[0]?.startsWith("### Slide")) {
      const titleMatch = lines[0].match(/###\s+Slide\s+\d+:?\s*(.*)/i);
      title = titleMatch?.[1]?.trim() || title;
      bullets = lines
        .slice(1)
        .map((l) => l.replace(/^[•\-\*]+\s*/, "").trim())
        .filter(Boolean);
    } else {
      title = lines[0]?.replace(/^[#•\-\*]+\s*/, "") || title;
      bullets = lines
        .slice(1)
        .map((l) => l.replace(/^[•\-\*]+\s*/, "").trim())
        .filter(Boolean);
    }

    return {
      slideNumber: idx + 1,
      title,
      bullets,
    };
  });
}

export function PptSlideView({ source }: PptSlideViewProps) {
  const [currentSlideIdx, setCurrentSlideIdx] = React.useState(0);
  const [viewStyle, setViewStyle] = React.useState<"single" | "all">("single");

  const slides: PptSlide[] = React.useMemo(() => {
    const metaSlides = source.metadata?.slides;
    if (Array.isArray(metaSlides) && metaSlides.length > 0) {
      return metaSlides as PptSlide[];
    }
    return parseRawContentToSlides(source.content || "");
  }, [source.metadata?.slides, source.content]);

  React.useEffect(() => {
    if (currentSlideIdx >= slides.length) {
      setCurrentSlideIdx(0);
    }
  }, [slides.length, currentSlideIdx]);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (viewStyle !== "single") return;
      if (e.key === "ArrowLeft") {
        setCurrentSlideIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length, viewStyle]);

  const activeSlide = slides[currentSlideIdx] ?? null;

  if (!slides || slides.length === 0 || !activeSlide) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        No slide content found.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Minimal Top Control Bar */}
      {slides.length > 1 && (
        <div className="flex items-center justify-end border-b border-border/40 px-3.5 py-1.5 text-xs shrink-0">
          <div className="flex items-center rounded border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewStyle("single")}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                viewStyle === "single"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => setViewStyle("all")}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                viewStyle === "all"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      {viewStyle === "single" ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center items-center">
          {/* Single Slide Box */}
          <div className="w-full max-w-xl rounded-xl border border-border/70 bg-card p-5 sm:p-7 shadow-2xs flex flex-col justify-between aspect-[16/10] sm:aspect-[16/9]">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-2 shrink-0">
              <span>Slide {activeSlide.slideNumber}</span>
              <span>
                {activeSlide.slideNumber} / {slides.length}
              </span>
            </div>

            <div className="my-auto py-2">
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground mb-3">
                {activeSlide.title}
              </h3>

              {activeSlide.bullets && activeSlide.bullets.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1.5 text-xs sm:text-sm text-foreground/85 leading-relaxed overflow-y-auto max-h-48 pr-1">
                  {activeSlide.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="pt-2 text-[10px] text-muted-foreground/50 font-mono text-right shrink-0">
              {source.title}
            </div>
          </div>

          {/* Navigation Buttons Below Presentation */}
          {slides.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentSlideIdx === 0}
                aria-label="Previous slide"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/70 bg-card hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={1.5} className="size-3.5" />
                <span>Previous</span>
              </button>

              <span className="font-mono text-xs text-muted-foreground px-1">
                {currentSlideIdx + 1} of {slides.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentSlideIdx((prev) =>
                    Math.min(slides.length - 1, prev + 1),
                  )
                }
                disabled={currentSlideIdx === slides.length - 1}
                aria-label="Next slide"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/70 bg-card hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
              >
                <span>Next</span>
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* All Slides Stacked */
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3">
          {slides.map((slide) => (
            <div
              key={`slide-box-${slide.slideNumber}`}
              className="rounded-xl border border-border/60 bg-card p-4 sm:p-5"
            >
              <div className="text-xs text-muted-foreground font-mono mb-1.5">
                Slide {slide.slideNumber}
              </div>
              <h4 className="text-sm sm:text-base font-semibold tracking-tight text-foreground mb-2">
                {slide.title}
              </h4>
              {slide.bullets && slide.bullets.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-foreground/85 leading-relaxed">
                  {slide.bullets.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
