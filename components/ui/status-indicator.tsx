import { cn } from "@/lib/utils";

/** Processing lifecycle shared by sources and learning artifacts. */
export type WorkStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  PENDING: "Queued",
  PROCESSING: "Processing",
  READY: "Ready",
  FAILED: "Failed",
};

const STATUS_DOT_CLASSES: Record<WorkStatus, string> = {
  PENDING: "bg-muted-foreground/40",
  PROCESSING: "bg-warning motion-safe:animate-pulse",
  READY: "bg-success",
  FAILED: "bg-destructive",
};

/**
 * Status as a small colored dot with a plain label. Failed is the only
 * state that colors its text, because it is the only one that needs
 * the user's attention.
 */
export function StatusIndicator({ status }: { status: WorkStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-mono">
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", STATUS_DOT_CLASSES[status])}
      />
      <span
        className={cn(
          status === "FAILED"
            ? "font-medium text-destructive"
            : "text-muted-foreground",
        )}
      >
        {WORK_STATUS_LABELS[status]}
      </span>
    </span>
  );
}
