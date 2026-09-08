"use client";

import type { Source } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { SOURCE_TYPE_LABELS, displayUrl } from "./source-meta";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SourceDetailDialogProps {
  source: Source | null;
  onClose: () => void;
  onRename: (source: Source) => void;
}

/**
 * Read-only detail view of a source: status, origin, indexing facts,
 * processing errors, and a bounded preview of the extracted text.
 */
export function SourceDetailDialog({
  source,
  onClose,
  onRename,
}: SourceDetailDialogProps) {
  const metadata = source?.metadata ?? null;
  const totalPages =
    typeof metadata?.totalPages === "number" ? metadata.totalPages : null;
  const processingError =
    typeof metadata?.processingError === "string" &&
    metadata.processingError.length > 0
      ? metadata.processingError
      : null;

  return (
    <Dialog
      open={source !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-lg">
        {source ? (
          <>
            {/* Header — pinned */}
            <DialogHeader className="shrink-0 px-5 pt-5 pb-2 text-left">
              <DialogTitle className="text-heading pr-6 font-serif">
                {source.title}
              </DialogTitle>
              <DialogDescription>
                {SOURCE_TYPE_LABELS[source.type]} · Added{" "}
                {formatDate(source.createdAt)}
              </DialogDescription>
            </DialogHeader>

            {/* Body — scrollable */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusIndicator status={source.status} />
                  </dd>
                </div>
                {source.url ? (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-muted-foreground shrink-0">Link</dt>
                    <dd className="min-w-0 text-right">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground break-all underline underline-offset-4 transition-colors"
                      >
                        {displayUrl(source.url)}
                      </a>
                    </dd>
                  </div>
                ) : null}

                {totalPages !== null ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Pages</dt>
                    <dd>{totalPages}</dd>
                  </div>
                ) : null}
              </dl>

              {source.status === "FAILED" ? (
                <div
                  role="alert"
                  className="border-destructive/40 bg-destructive/5 rounded-md border px-4 py-3 text-sm"
                >
                  <p className="text-destructive font-medium">
                    Processing failed
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {processingError ??
                      "The source could not be processed. Delete it and try importing again."}
                  </p>
                </div>
              ) : null}

              {source.content ? (
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-medium tracking-wide uppercase">
                    Content preview
                  </p>
                  <div className="bg-muted/40 max-h-56 overflow-y-auto rounded-md border p-3">
                    <p className="text-foreground/90 text-xs leading-relaxed whitespace-pre-wrap">
                      {source.content.length > 4000
                        ? `${source.content.slice(0, 4000)}…`
                        : source.content}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer — pinned */}
            <div className="flex shrink-0 items-center justify-end gap-2 px-5 pb-5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRename(source)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Rename
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                Close
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
