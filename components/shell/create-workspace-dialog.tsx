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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Overrides the default behavior of navigating into the new workspace. */
  onCreated?: (workspace: Workspace) => void;
}

/** Creates a workspace with inline zod field errors and toast fallback. */
export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const { push } = useToast();
  const createWorkspace = useCreateWorkspace();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );

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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-heading font-serif">
              New workspace
            </DialogTitle>
            <DialogDescription>
              A workspace groups sources, conversations, and study material
              around one topic.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
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
            <div className="grid gap-1.5">
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createWorkspace.isPending || title.trim().length === 0}
            >
              {createWorkspace.isPending ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
