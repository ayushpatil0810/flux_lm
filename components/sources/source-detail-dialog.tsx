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
  DialogFooter,
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
  const chunkCount =
    typeof metadata?.chunkCount === "number" ? metadata.chunkCount : null;
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
      <DialogContent className="sm:max-w-lg">
        {source ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-heading pr-6 font-serif">
                {source.title}
              </DialogTitle>
              <DialogDescription>
                {SOURCE_TYPE_LABELS[source.type]} · Added{" "}
                {formatDate(source.createdAt)}
              </DialogDescription>
            </DialogHeader>

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
              {chunkCount !== null ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Indexed chunks</dt>
                  <dd>{chunkCount}</dd>
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
                  Extracted text
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

            <DialogFooter>
              <Button variant="outline" onClick={() => onRename(source)}>
                Rename
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
