"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { Folder01Icon, ArrowRight01Icon, Delete01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';

import * as React from "react";
import Link from "next/link";
;

import type { Workspace } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceDialog } from "@/components/shell/create-workspace-dialog";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";

export function DashboardClient({ initialWorkspaces }: { initialWorkspaces: Workspace[] }) {
  const { data: workspaces } = useWorkspaces(initialWorkspaces);
  const deleteWorkspace = useDeleteWorkspace();
  const { push } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Workspace | null>(null);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteWorkspace.mutateAsync(deleteTarget.id);
      push({
        title: "Workspace deleted",
        description: `"${deleteTarget.title}" and its contents were removed.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      push({
        variant: "destructive",
        title: "Could not delete workspace",
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className="flex flex-col gap-10 px-4 py-6 md:px-8 md:py-10">
      <section className="flex flex-col gap-5">
        {workspaces && workspaces.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <HugeiconsIcon icon={Folder01Icon} strokeWidth={1.5} className="size-5" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(ws);
                      }}
                      title="Delete workspace"
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={1.5} className="size-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg tracking-tight">
                      {ws.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {ws.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground font-mono">
                    {ws.id.substring(0, 8)}...
                  </span>
                  <Link
                    href={`/workspace/${ws.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Enter Workspace
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="size-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <HugeiconsIcon icon={Folder01Icon} strokeWidth={1.5} className="size-6" />
            </div>
            <h3 className="font-serif text-xl font-medium tracking-tight">
              No workspaces yet
            </h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Create your first knowledge workspace to start organizing sources, notes, and AI conversations.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-6 gap-1.5"
            >
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.5} className="size-4" />
              New Workspace
            </Button>
          </div>
        )}
      </section>

      {/* Local dialog instance for empty-state CTA */}
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete workspace"
        description={
          <>
            This permanently deletes{" "}
            <span className="font-medium text-foreground">
              {deleteTarget?.title}
            </span>
            , including its sources, artifacts, and conversations. This cannot
            be undone.
          </>
        }
        confirmLabel="Delete workspace"
        pendingLabel="Deleting…"
        isPending={deleteWorkspace.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
