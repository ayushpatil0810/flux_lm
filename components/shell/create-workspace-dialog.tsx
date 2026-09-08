"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getErrorMessage, getFieldErrors, type Workspace } from "@/lib/api";
import { useCreateWorkspace } from "@/hooks/use-workspaces";
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
import { Textarea } from "@/components/ui/textarea";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: { title?: string; description?: string };
  /** Overrides the default behavior of navigating into the new workspace. */
  onCreated?: (workspace: Workspace) => void;
}

/** Creates a workspace with inline zod field errors and toast fallback. */
export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  initialValues,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const { push } = useToast();
  const createWorkspace = useCreateWorkspace();

  const [title, setTitle] = React.useState(initialValues?.title ?? "");
  const [description, setDescription] = React.useState(
    initialValues?.description ?? "",
  );
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );

  React.useEffect(() => {
    if (open) {
      setTitle(initialValues?.title ?? "");
      setDescription(initialValues?.description ?? "");
      setFieldErrors({});
    }
  }, [open, initialValues]);

  function reset() {
    setTitle("");
    setDescription("");
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});

    try {
      const workspace = await createWorkspace.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      push({ title: "Workspace created" });
      onOpenChange(false);
      reset();
      if (onCreated) {
        onCreated(workspace);
      } else {
        router.push(`/workspace/${workspace.id}`);
      }
    } catch (error) {
      const fields = getFieldErrors(error);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        push({
          variant: "destructive",
          title: "Could not create workspace",
          description: getErrorMessage(error),
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-md">
        {/* Header — pinned */}
        <DialogHeader className="shrink-0 px-5 pt-5 pb-2 text-left">
          <DialogTitle className="text-heading font-serif">
            New workspace
          </DialogTitle>
          <DialogDescription className="sr-only">
            New workspace
          </DialogDescription>
        </DialogHeader>

        {/* Body — scrollable */}
        <form
          id="create-workspace-form"
          onSubmit={handleSubmit}
          className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="workspace-title">Title</Label>
            <Input
              id="workspace-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              autoFocus
              autoComplete="off"
              placeholder="Distributed systems reading"
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={
                fieldErrors.title ? "workspace-title-error" : undefined
              }
            />
            {fieldErrors.title ? (
              <p
                id="workspace-title-error"
                className="text-destructive text-sm"
              >
                {fieldErrors.title}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workspace-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="workspace-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What this collection is for"
              className="resize-none"
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={
                fieldErrors.description
                  ? "workspace-description-error"
                  : undefined
              }
            />
            {fieldErrors.description ? (
              <p
                id="workspace-description-error"
                className="text-destructive text-sm"
              >
                {fieldErrors.description}
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            form="create-workspace-form"
            disabled={createWorkspace.isPending || title.trim().length === 0}
          >
            {createWorkspace.isPending ? "Creating…" : "Create workspace"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
