"use client";

import * as React from "react";

import { getErrorMessage, getFieldErrors, type LearningArtifact } from "@/lib/api";
import { useRenameArtifact } from "@/hooks/use-artifacts";
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
import { cleanArtifactTitle } from "./artifact-meta";

interface RenameArtifactDialogProps {
  workspaceId: string;
  artifact: LearningArtifact | null;
  onClose: () => void;
}

/** Renames a learning artifact via PATCH /api/workspaces/[id]/artifacts/[artifactId]. */
export function RenameArtifactDialog({
  workspaceId,
  artifact,
  onClose,
}: RenameArtifactDialogProps) {
  return (
    <Dialog
      open={artifact !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-md">
        {artifact ? (
          <RenameForm
            key={artifact.id}
            workspaceId={workspaceId}
            artifact={artifact}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({
  workspaceId,
  artifact,
  onClose,
}: {
  workspaceId: string;
  artifact: LearningArtifact;
  onClose: () => void;
}) {
  const { push } = useToast();
  const rename = useRenameArtifact(workspaceId);
  const [title, setTitle] = React.useState(cleanArtifactTitle(artifact.title));
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    try {
      await rename.mutateAsync({
        artifactId: artifact.id,
        title: title.trim(),
      });
      push({ title: "Artifact renamed" });
      onClose();
    } catch (error) {
      const fields = getFieldErrors(error);
      if (fields.title) {
        setFieldError(fields.title);
      } else {
        push({
          variant: "destructive",
          title: "Could not rename artifact",
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
          Rename artifact
        </DialogTitle>
        <DialogDescription className="sr-only">
          Give this artifact a descriptive name
        </DialogDescription>
      </DialogHeader>

      {/* Body — scrollable */}
      <form
        id="rename-artifact-form"
        onSubmit={handleSubmit}
        className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4"
      >
        <div className="space-y-1.5">
          <Label
            htmlFor="rename-artifact-title"
            className="text-xs text-muted-foreground font-normal"
          >
            Title
          </Label>
          <Input
            id="rename-artifact-title"
            required
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            className="h-8.5 text-xs"
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "rename-artifact-error" : undefined}
          />
          {fieldError ? (
            <p id="rename-artifact-error" className="text-destructive text-xs">
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
          form="rename-artifact-form"
          disabled={rename.isPending || title.trim().length === 0}
          className="h-8 text-xs"
        >
          {rename.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </>
  );
}
