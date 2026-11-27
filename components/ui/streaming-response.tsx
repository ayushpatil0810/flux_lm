"use client";

// Adapted from Rare UI's Streaming Response (https://rareui.com).
// Copyright (c) 2026 Swami Malode. See rareui.LICENSE.

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MarkdownContent } from "./markdown-content";

const WORDS_PER_BATCH = 3;
const CATCH_UP = 12;
const WORD_INTERVAL_MS = 22;

// Prefer whole words, but keep revealing partial words and scripts without spaces.
function wordEnds(text: string) {
  const ends: number[] = [];
  for (const match of text.matchAll(/\S+/gu)) {
    ends.push(match.index + match[0].length);
  }
  return ends;
}

export function StreamingResponse({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const [shown, setShown] = useState(0);
  const revealed = useRef(0);
  const nextAt = useRef(0);

  useEffect(() => {
    if (!streaming || reducedMotion || text.length <= revealed.current) return;

    const ends = wordEnds(text);
    let index = ends.findIndex((end) => end > revealed.current);
    if (index === -1) return;

    let frame = 0;
    function tick(now: number) {
      if (now >= nextAt.current) {
        const backlog = ends.length - index;
        const batch = WORDS_PER_BATCH + Math.floor(backlog / CATCH_UP);
        index = Math.min(index + batch, ends.length);
        const end = ends[index - 1];
        const tail = text[end - 1];
        const pause = /[.!?]/.test(tail) ? 65 : /[,;:]/.test(tail) ? 25 : 0;

        revealed.current = end;
        setShown(end);
        nextAt.current =
          now + (batch * WORD_INTERVAL_MS + pause) / (1 + backlog / CATCH_UP);
      }
      if (index < ends.length) {
        frame = window.requestAnimationFrame(tick);
      }
    }

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion, streaming, text]);

  const visible = streaming && !reducedMotion ? text.slice(0, shown) : text;

  return (
    <div data-slot="streaming-response" aria-busy={streaming}>
      <MarkdownContent content={visible} streaming={streaming} />
    </div>
  );
}
