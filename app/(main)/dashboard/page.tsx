"use client";

import * as React from "react";
import Link from "next/link";
import { Folder, ArrowRight, Trash2, Plus } from "lucide-react";

import type { Workspace } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceDialog } from "@/components/shell/create-workspace-dialog";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";

export default function DashboardPage() {
  const { data: workspaces, isPending } = useWorkspaces();
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
        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col justify-between rounded-xl border bg-card/50 p-5 h-48 animate-pulse"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="size-10 rounded-lg bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 w-1/2 rounded bg-muted" />
                    <div className="h-3 w-3/4 rounded bg-muted/60" />
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="h-3 w-16 rounded bg-muted/60" />
                  <div className="h-4 w-24 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Folder className="size-5" />
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
                      <Trash2 className="size-4" />
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
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-12 text-center bg-card/30">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Folder className="size-6" />
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
              <Plus className="size-4" />
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
