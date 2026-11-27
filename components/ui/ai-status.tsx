"use client";

// Adapted from Rare UI's Inline AI Status (https://rareui.com).
// Copyright (c) 2026 Swami Malode. See rareui.LICENSE.

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export function AiStatus({ state }: { state: "thinking" | "writing" }) {
  const reducedMotion = useReducedMotion();
  const label = state === "thinking" ? "Thinking…" : "Writing…";

  return (
    <div
      data-slot="ai-status"
      data-state={state}
      role="status"
      className="text-muted-foreground flex h-7 w-fit items-center gap-2 text-xs font-medium"
    >
      <span
        aria-hidden="true"
        className="text-primary grid size-4 place-items-center"
      >
        <AnimatePresence initial={false}>
          <motion.svg
            key={state}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
            transition={{ duration: reducedMotion ? 0 : 0.16 }}
            className="col-start-1 row-start-1 size-4"
          >
            {state === "thinking" ? (
              <motion.g
                animate={
                  reducedMotion ? undefined : { opacity: [0.45, 1, 0.45] }
                }
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <circle cx={11} cy={11} r={6} />
                <path d="m16 16 3.5 3.5" />
              </motion.g>
            ) : (
              <motion.path
                d="M3 18c3-5 6 5 9 0l7-7 2-5-5 2-7 7"
                initial={false}
                animate={
                  reducedMotion ? { pathLength: 1 } : { pathLength: [0.3, 1] }
                }
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 1.1, repeat: Infinity, repeatDelay: 0.2 }
                }
              />
            )}
          </motion.svg>
        </AnimatePresence>
      </span>
      <span>{label}</span>
    </div>
  );
}
