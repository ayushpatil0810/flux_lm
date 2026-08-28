"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading02Icon, MoreHorizontalIcon, PlusSignIcon } from '@hugeicons/core-free-icons';

import * as React from "react";
;

import { getErrorMessage, type MemoryItem } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useDeleteMemory, useMemories } from "@/hooks/use-memories";
import { useToast } from "@/components/providers/toast-provider";
import { EmptyState, ErrorState, LoadingState } from "@/components/shell/states";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MemoryFormDialog } from "./memory-form-dialog";

function memoryDateLine(memory: MemoryItem): string | null {
  if (
    memory.updated_at &&
    memory.created_at &&
    memory.updated_at !== memory.created_at
  ) {
    return `Updated ${formatDate(memory.updated_at)}`;
  }
  if (memory.created_at) return `Added ${formatDate(memory.created_at)}`;
  return null;
}

/**
 * What Flux remembers across conversations. Memories also accumulate
 * automatically from chat; this is where they can be reviewed, corrected,
 * or removed.
 */
export function MemoriesView() {
  const { push } = useToast();
  const { data: memories, isPending, isError, error, refetch } = useMemories();
  const deleteMemory = useDeleteMemory();

  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<MemoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MemoryItem | null>(
    null,
  );

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    try {
      await deleteMemory.mutateAsync(deleteTarget.id);
      push({ title: "Memory deleted" });
      setDeleteTarget(null);
    } catch (deleteError) {
      push({
        variant: "destructive",
        title: "Could not delete memory",
        description: getErrorMessage(deleteError),
      });
    }
  }
  // The topbar context was removed, but users can still add memories
  // via the empty state or we can add a button here if needed.
  // For now, we'll let DashboardTopbar handle the static title/description.

  return (
    <>
      <div className="px-6 py-8 md:px-10">
        <div className="max-w-2xl">
          {isPending ? (
            <LoadingState label="Loading memories" />
          ) : isError ? (
            <ErrorState
              title="Could not load memories"
              message={getErrorMessage(error)}
              onRetry={() => refetch()}
            />
          ) : memories.length === 0 ? (
            <EmptyState
              title="Nothing remembered yet"
              copy="As you chat, Flux quietly remembers facts and preferences that make later answers better. You can also add one yourself."
              action={
                <Button onClick={() => setAddOpen(true)}>
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.5} className="size-4" aria-hidden />
                  Add memory
                </Button>
              }
            />
          ) : (
            <>
              <div className="mb-6 flex items-center justify-end">
                <Button onClick={() => setAddOpen(true)} className="h-9 gap-1.5 px-3.5">
                  <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.5} className="size-4" aria-hidden />
                  Add memory
                </Button>
              </div>
              <ul className="border-y">
              {memories.map((memory, index) => {
                const dateLine = memoryDateLine(memory);
                return (
                  <li
                    key={memory.id ?? index}
                    className={`flex items-start justify-between gap-4 border-b py-4 last:border-0 ${memory.isOptimistic ? "opacity-50" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed flex items-center gap-2">
                        {memory.memory}
                        {memory.isOptimistic && (
                          <HugeiconsIcon icon={Loading02Icon} strokeWidth={1.5} className="size-3 animate-spin text-muted-foreground" aria-hidden />
                        )}
                      </p>
                      {dateLine ? (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {dateLine}
                        </p>
                      ) : null}
                    </div>
                    {!memory.isOptimistic && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Memory options"
                          >
                            <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={1.5} className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setEditTarget(memory)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleteTarget(memory)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                );
              })}
              </ul>
            </>
          )}
        </div>
      </div>

      <MemoryFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <MemoryFormDialog
        key={editTarget?.id ?? "edit-closed"}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        memory={editTarget ?? undefined}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete memory"
        description={
          <>
            Flux will no longer use this in conversations:
            <span className="mt-2 block max-h-28 overflow-y-auto rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground/80">
              {deleteTarget?.memory}
            </span>
          </>
        }
        confirmLabel="Delete memory"
        pendingLabel="Deleting…"
        isPending={deleteMemory.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}

