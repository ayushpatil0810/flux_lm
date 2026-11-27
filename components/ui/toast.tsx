"use client";

// Adapted from Rare UI's Toast (https://rareui.com).
// Copyright (c) 2026 Swami Malode. See rareui.LICENSE.

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { useSyncExternalStore } from "react";
import { Toaster as Sonner, toast as sonner } from "sonner";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  /** Pass 0 to keep the toast visible until dismissed. */
  duration?: number;
}

function ToastCard({
  id,
  title,
  description,
  variant,
}: ToastOptions & { id: string | number }) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      data-slot="toast"
      className="border-border bg-popover text-popover-foreground flex h-full w-full items-start gap-3 rounded-xl border p-3 shadow-md"
    >
      {variant === "destructive" && (
        <span
          aria-hidden="true"
          className="bg-destructive/10 text-destructive grid size-8 shrink-0 place-items-center rounded-lg"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="size-4"
          >
            <motion.path
              d="M7.5 7.5l9 9m0-9-9 9"
              initial={reducedMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: reducedMotion ? 0 : 0.2,
                ease: "easeOut",
              }}
            />
          </svg>
        </span>
      )}
      <div className="min-w-0 flex-1 self-center wrap-break-word">
        <p className="text-heading text-sm leading-5 font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => sonner.dismiss(id)}
        className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring grid size-8 shrink-0 place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

const notifications = {
  push({ duration, ...options }: ToastOptions) {
    sonner.custom((id) => <ToastCard id={id} {...options} />, {
      duration: duration === 0 ? Infinity : duration,
    });
  },
};

export function useToast() {
  return notifications;
}

const subscribe = () => () => {};

export function Toaster() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!mounted) return null;

  return createPortal(
    <Sonner
      position="bottom-right"
      visibleToasts={4}
      duration={5000}
      gap={8}
      offset={16}
      expand
      mobileOffset={{
        bottom: "calc(1rem + var(--safe-bottom))",
        left: 16,
        right: 16,
      }}
      toastOptions={{ unstyled: true, className: "w-full" }}
    />,
    document.body,
  );
}
