"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

import * as React from "react";
;

import { cn } from "@/lib/utils";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  /** Milliseconds before auto-dismiss. Pass 0 to keep until dismissed. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  push: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * Global notification channel. Use for API failures, rate limits, and
 * confirmations of meaningful actions. Not for decorative messages.
 */
export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);
  const timeouts = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  React.useEffect(() => {
    return () => {
      timeouts.current.forEach((t) => clearTimeout(t));
      timeouts.current.clear();
    };
  }, []);

  const dismiss = React.useCallback((id: string) => {
    if (timeouts.current.has(id)) {
      clearTimeout(timeouts.current.get(id)!);
      timeouts.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = React.useCallback(
    (options: ToastOptions) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      // Keep at most four visible; drop the oldest first.
      setToasts((current) => [...current.slice(-3), { ...options, id }]);
      const duration = options.duration ?? 5000;
      if (duration > 0) {
        const timeoutId = setTimeout(() => {
          dismiss(id);
        }, duration);
        timeouts.current.set(id, timeoutId);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-2 sm:left-auto sm:w-[360px]"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "ui-enter-fade pointer-events-auto w-full rounded-lg border bg-popover px-4 py-3 text-popover-foreground",
              toast.variant === "destructive"
                ? "border-destructive/50"
                : "border-border",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    toast.variant === "destructive" && "text-destructive",
                  )}
                >
                  {toast.title}
                </p>
                {toast.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {toast.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={1.5} className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
