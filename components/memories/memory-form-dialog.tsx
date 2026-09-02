"use client";

import * as React from "react";

import { getErrorMessage, getFieldErrors, type MemoryItem } from "@/lib/api";
import { useCreateMemory, useUpdateMemory } from "@/hooks/use-memories";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface MemoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this memory; otherwise it adds a new one. */
  memory?: MemoryItem;
}

/** Add/edit dialog for a single memory, enforcing the 1000-char API limit. */
export function MemoryFormDialog({
  open,
  onOpenChange,
  memory,
}: MemoryFormDialogProps) {
  const { push } = useToast();
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();

  const [text, setText] = React.useState(memory?.memory ?? "");
  const [fieldError, setFieldError] = React.useState<string | null>(null);

  const isEdit = memory !== undefined;
  const isPending = createMemory.isPending || updateMemory.isPending;

  function handleOpenChange(next: boolean) {
    if (next) {
      setText(memory?.memory ?? "");
      setFieldError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    const value = text.trim();
    try {
      if (isEdit && memory.id) {
        await updateMemory.mutateAsync({ id: memory.id, text: value });
        push({ title: "Memory updated" });
      } else {
        await createMemory.mutateAsync(value);
        push({
          title: "Memory added",
          description: "Flux will use it in future conversations.",
        });
      }
      onOpenChange(false);
    } catch (error) {
      const fields = getFieldErrors(error);
      if (fields.text) {
        setFieldError(fields.text);
      } else {
        push({
          variant: "destructive",
          title: isEdit ? "Could not update memory" : "Could not add memory",
          description: getErrorMessage(error),
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-heading font-serif">
              {isEdit ? "Edit memory" : "Add a memory"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Change what Flux remembers."
                : "Something Flux should remember about you or your work, written plainly."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-4">
            <Label htmlFor="memory-text">Memory</Label>
            <Textarea
              id="memory-text"
              rows={4}
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={1000}
              placeholder="e.g. I prefer concise answers with examples in TypeScript."
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "memory-text-error" : undefined}
            />
            <div className="flex items-start justify-between gap-3">
              {fieldError ? (
                <p id="memory-text-error" className="text-destructive text-sm">
                  {fieldError}
                </p>
              ) : (
                <span />
              )}
              <span className="text-muted-foreground shrink-0 text-xs">
                {text.length}/1000
              </span>
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
              disabled={isPending || text.trim().length === 0}
            >
              {isPending ? "Saving…" : isEdit ? "Save" : "Add memory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
