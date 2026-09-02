"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  ArrowRight01Icon,
  Delete01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

import * as React from "react";
import Link from "next/link";

import type { Workspace } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceDialog } from "@/components/shell/create-workspace-dialog";
import { ConfirmDeleteDialog } from "@/components/sources/confirm-delete-dialog";

export function DashboardClient({
  initialWorkspaces,
}: {
  initialWorkspaces: Workspace[];
}) {
  const { data: workspaces } = useWorkspaces(initialWorkspaces);
  const deleteWorkspace = useDeleteWorkspace();
  const { push } = useToast();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Workspace | null>(
    null,
  );

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
                className="group border-border/50 bg-card/40 hover:border-primary/40 hover:bg-card/60 relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-5 transition-colors duration-200"
              >
                {/* Subtle noise texture */}
                <div className="bg-noise absolute inset-0 z-0 opacity-40 mix-blend-overlay" />
                {/* Hover glow effect */}
                <div className="from-primary/10 via-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="pointer-events-none relative z-20 flex flex-col gap-4">
                  <div className="pointer-events-none flex items-center justify-between">
                    <div className="bg-primary/10 text-primary pointer-events-none flex size-11 items-center justify-center rounded-xl shadow-sm">
                      <HugeiconsIcon
                        icon={Folder01Icon}
                        strokeWidth={1.5}
                        className="size-5"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 pointer-events-auto relative z-20 size-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(ws);
                      }}
                      title="Delete workspace"
                    >
                      <HugeiconsIcon
                        icon={Delete01Icon}
                        strokeWidth={1.5}
                        className="size-4"
                      />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-foreground/90 group-hover:text-primary text-lg font-semibold tracking-tight transition-colors">
                      {ws.title}
                    </h3>
                    <p className="text-muted-foreground/80 mt-1.5 line-clamp-2 text-[13px] leading-relaxed">
                      {ws.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="pointer-events-none relative z-10 mt-6 flex items-center justify-end">
                  <span className="text-primary inline-flex -translate-x-2 items-center gap-1.5 text-sm font-medium opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                    Open
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={1.5}
                      className="size-4"
                    />
                  </span>
                </div>

                <Link
                  href={`/workspace/${ws.id}`}
                  className="absolute inset-0 z-10"
                  aria-label={`Open ${ws.title}`}
                />
              </div>
            ))}

            {/* New workspace dashed card */}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-card/30 hover:text-foreground flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-transparent p-5 transition-colors duration-200"
            >
              <div className="border-border/50 flex size-10 items-center justify-center rounded-xl border-2 border-dashed">
                <HugeiconsIcon
                  icon={PlusSignIcon}
                  strokeWidth={1.5}
                  className="size-5"
                />
              </div>
              <span className="text-sm">New workspace</span>
            </button>
          </div>
        ) : (
          <div className="border-border/70 bg-card/30 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
            <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-2xl">
              <HugeiconsIcon
                icon={Folder01Icon}
                strokeWidth={1.5}
                className="size-6"
              />
            </div>
            <h3 className="font-serif text-xl font-medium tracking-tight">
              No workspaces yet
            </h3>
            <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">
              Create your first knowledge workspace to start organizing sources,
              notes, and AI conversations.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-6 gap-1.5"
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                strokeWidth={1.5}
                className="size-4"
              />
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
            <span className="text-foreground font-medium">
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
