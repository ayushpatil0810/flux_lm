"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon } from "@hugeicons/core-free-icons";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getErrorMessage, getFieldErrors, type Workspace } from "@/lib/api";
import { useDeleteWorkspace, useUpdateWorkspace } from "@/hooks/use-workspaces";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS = [
  {
    value: "gpt-4o-mini",
    label: "GPT-4o mini",
    description: "Fast, great for most questions",
  },
  {
    value: "gpt-4o",
    label: "GPT-4o",
    description: "Stronger reasoning, harder material",
  },
] as const;

interface EditWorkspaceDialogProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Edits an existing workspace with inline zod field errors and toast fallback. */
export function EditWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: EditWorkspaceDialogProps) {
  const router = useRouter();
  const { push } = useToast();
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [model, setModel] = React.useState<string>("gpt-4o-mini");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );

  React.useEffect(() => {
    if (workspace && open) {
      setTitle(workspace.title);
      setDescription(workspace.description || "");
      setModel(workspace.defaultModel === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini");
      setFieldErrors({});
    }
  }, [workspace, open]);

  const unchanged =
    workspace !== null &&
    title.trim() === workspace.title &&
    description.trim() === (workspace.description || "") &&
    model === (workspace.defaultModel === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspace) return;
    setFieldErrors({});

    try {
      await updateWorkspace.mutateAsync({
        id: workspace.id,
        input: {
          title: title.trim(),
          description: description.trim() || undefined,
          defaultModel: model,
        },
      });
      push({ title: "Workspace updated" });
      onOpenChange(false);
    } catch (error) {
      const fields = getFieldErrors(error);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        push({
          variant: "destructive",
          title: "Could not update workspace",
          description: getErrorMessage(error),
        });
      }
    }
  }

  async function handleDelete() {
    if (!workspace) return;
    try {
      await deleteWorkspace.mutateAsync(workspace.id);
      push({
        title: "Workspace deleted",
        description: `"${workspace.title}" and its contents were removed.`,
      });
      setDeleteOpen(false);
      onOpenChange(false);
      router.push("/dashboard");
    } catch (error) {
      push({
        variant: "destructive",
        title: "Could not delete workspace",
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] gap-0 overflow-hidden p-0 sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <DialogHeader className="border-border/30 border-b px-4 sm:px-5 pt-5 pb-4">
            <DialogTitle className="text-sm font-medium">
              Workspace settings
            </DialogTitle>
          </DialogHeader>

          {/* Body */}
          <div className="space-y-4 px-4 sm:px-5 py-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-workspace-title"
                className="text-muted-foreground block text-xs font-medium tracking-wider uppercase"
              >
                Name
              </label>
              <Input
                id="edit-workspace-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                autoFocus
                autoComplete="off"
                placeholder="e.g. Distributed systems"
                className="h-9 text-sm"
                aria-invalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title ? (
                <p className="text-destructive text-xs">{fieldErrors.title}</p>
              ) : null}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label
                htmlFor="edit-workspace-description"
                className="text-muted-foreground block text-xs font-medium tracking-wider uppercase"
              >
                Description{" "}
                <span className="font-normal normal-case">(optional)</span>
              </label>
              <Textarea
                id="edit-workspace-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="What this collection is for"
                className="resize-none text-sm"
                aria-invalid={Boolean(fieldErrors.description)}
              />
              {fieldErrors.description ? (
                <p className="text-destructive text-xs">
                  {fieldErrors.description}
                </p>
              ) : null}
            </div>

            {/* Model */}
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Default model
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                {MODEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer flex-col rounded-lg border px-3 py-2.5 transition-colors",
                      model === option.value
                        ? "border-primary/60 bg-primary/5"
                        : "border-border/40 hover:border-border/70 hover:bg-white/3",
                    )}
                  >
                    <input
                      type="radio"
                      name="workspace-model"
                      value={option.value}
                      checked={model === option.value}
                      onChange={() => setModel(option.value)}
                      className="sr-only"
                    />
                    <span className="text-xs leading-none font-medium">
                      {option.label}
                    </span>
                    <span className="text-muted-foreground/70 mt-1 text-[11px] leading-snug">
                      {option.description}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-border/30 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-t px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="text-muted-foreground/60 hover:text-destructive flex items-center justify-center sm:justify-start gap-1.5 text-xs py-1 transition-colors"
            >
              <HugeiconsIcon
                icon={Delete01Icon}
                strokeWidth={1.5}
                className="size-3.5"
                aria-hidden
              />
              Delete workspace
            </button>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1 sm:flex-none"
                disabled={
                  updateWorkspace.isPending ||
                  title.trim().length === 0 ||
                  unchanged
                }
              >
                {updateWorkspace.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </form>

        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete workspace"
          description={
            <>
              This permanently deletes{" "}
              <span className="text-foreground font-medium">
                {workspace?.title}
              </span>
              , including its sources, artifacts, and conversations. This cannot
              be undone.
            </>
          }
          confirmLabel="Delete workspace"
          pendingLabel="Deleting…"
          isPending={deleteWorkspace.isPending}
          onConfirm={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
}
