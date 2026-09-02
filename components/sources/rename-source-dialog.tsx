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
  DialogFooter,
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
      <DialogContent className="sm:max-w-md">
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
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-heading font-serif">
          Rename source
        </DialogTitle>
        <DialogDescription>
          The title is only for your library. It does not change the content.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5 py-4">
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
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={rename.isPending || title.trim().length === 0}
        >
          {rename.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
