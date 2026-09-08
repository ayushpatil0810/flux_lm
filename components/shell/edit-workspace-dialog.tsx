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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

/** Edits an existing workspace using standard shadcn dialog primitives. */
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex w-[calc(100%-2rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-md">
          {/* Header — pinned */}
          <DialogHeader className="border-border/30 shrink-0 border-b px-5 pt-5 pb-4 text-left">
            <DialogTitle className="text-heading font-serif">
              Workspace settings
            </DialogTitle>
            <DialogDescription className="sr-only">
              Workspace settings
            </DialogDescription>
          </DialogHeader>

          {/* Body — scrollable */}
          <form
            id="edit-workspace-form"
            onSubmit={handleSubmit}
            className="no-scrollbar flex-1 overflow-y-auto px-5 py-4 space-y-4"
          >
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-workspace-title">Name</Label>
              <Input
                id="edit-workspace-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
                autoFocus
                autoComplete="off"
                placeholder="e.g. Distributed systems"
                aria-invalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title ? (
                <p className="text-destructive text-xs">{fieldErrors.title}</p>
              ) : null}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-workspace-description">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="edit-workspace-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="What this collection is for"
                className="resize-none"
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
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setModel(option.value)}
                    className={cn(
                      "relative flex cursor-pointer flex-col text-left rounded-xl border p-3 transition-colors",
                      model === option.value
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-border/40 text-muted-foreground hover:border-border/70 hover:text-foreground hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-medium leading-none text-foreground">
                        {option.label}
                      </span>
                      {model === option.value && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-muted-foreground/80 mt-1.5 text-[11px] leading-snug">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Footer — pinned */}
          <div className="border-border/30 flex shrink-0 items-center justify-between border-t px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2.5 text-xs transition-colors gap-1.5 cursor-pointer"
            >
              <HugeiconsIcon
                icon={Delete01Icon}
                strokeWidth={1.5}
                className="size-3.5"
                aria-hidden
              />
              Delete workspace
            </Button>

            <div className="flex items-center gap-2">
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
                form="edit-workspace-form"
                disabled={
                  updateWorkspace.isPending ||
                  title.trim().length === 0 ||
                  unchanged
                }
              >
                {updateWorkspace.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </>
  );
}
