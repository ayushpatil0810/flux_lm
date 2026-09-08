"use client";

import * as React from "react";

import { getErrorMessage, getFieldErrors, type Source } from "@/lib/api";
import { useRenameSource } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameSourceDialogProps {
  workspaceId: string;
  source: Source | null;
  onClose: () => void;
}

/** Renames a source via PATCH /api/sources/[id]. */
export function RenameSourceDialog({
  workspaceId,
  source,
  onClose,
}: RenameSourceDialogProps) {
  return (
    <Dialog
      open={source !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-md">
        {source ? (
          <RenameForm
            key={source.id}
            workspaceId={workspaceId}
            source={source}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({
  workspaceId,
  source,
  onClose,
}: {
  workspaceId: string;
  source: Source;
  onClose: () => void;
}) {
  const { push } = useToast();
  const rename = useRenameSource(workspaceId);
  const [title, setTitle] = React.useState(source.title);
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    try {
      await rename.mutateAsync({ sourceId: source.id, title: title.trim() });
      push({ title: "Source renamed" });
      onClose();
    } catch (error) {
      const fields = getFieldErrors(error);
      if (fields.title) {
        setFieldError(fields.title);
      } else {
        push({
          variant: "destructive",
          title: "Could not rename source",
          description: getErrorMessage(error),
        });
      }
    }
  }

  return (
    <>
      {/* Header — pinned */}
      <DialogHeader className="shrink-0 px-5 pt-5 pb-0 text-left">
        <DialogTitle className="text-heading font-serif">
          Rename source
        </DialogTitle>
        <DialogDescription className="sr-only">
          Rename source
        </DialogDescription>
      </DialogHeader>

      {/* Body — scrollable */}
      <form
        id="rename-source-form"
        onSubmit={handleSubmit}
        className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="rename-source-title">Title</Label>
          <Input
            id="rename-source-title"
            required
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "rename-source-error" : undefined}
          />
          {fieldError ? (
            <p id="rename-source-error" className="text-destructive text-sm">
              {fieldError}
            </p>
          ) : null}
        </div>
      </form>

      {/* Footer — pinned */}
      <div className="flex shrink-0 items-center justify-end gap-2 px-5 pb-5 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          form="rename-source-form"
          disabled={rename.isPending || title.trim().length === 0}
          className="h-8 text-xs"
        >
          {rename.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </>
  );
}
