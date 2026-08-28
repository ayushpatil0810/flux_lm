import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon } from '@hugeicons/core-free-icons';
import * as React from "react";
;

import { Button } from "@/components/ui/button";

/**
 * Quiet loading treatment: a small spinner with an honest label.
 * Preferred over skeleton screens for whole-region loads.
 */
export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground"
    >
      <HugeiconsIcon icon={Loading02Icon} strokeWidth={1.5} className="size-4 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  copy: string;
  action?: React.ReactNode;
}

/** Quiet empty state: serif heading, one line of guidance, one action. */
export function EmptyState({ title, copy, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-14 text-center">
      <h2 className="font-serif text-heading">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {copy}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Inline error panel with an explicit retry, announced assertively. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/5 px-5 py-4"
    >
      <p className="text-sm font-medium">{title}</p>
      {message ? (
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      ) : null}
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Try again
        </Button>
      ) : null}
    </div>
  );
}
