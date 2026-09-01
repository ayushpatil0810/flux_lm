"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { Folder01Icon, ArrowRight01Icon, Delete01Icon, PlusSignIcon } from '@hugeicons/core-free-icons';

import * as React from "react";
import Link from "next/link";

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
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 transition-colors duration-200 hover:border-primary/40 hover:bg-card/60 cursor-pointer"
              >
                {/* Subtle noise texture */}
                <div 
                  className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay" 
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
                />
                {/* Hover glow effect */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-20 flex flex-col gap-4 pointer-events-none">
                  <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm pointer-events-none">
                      <HugeiconsIcon icon={Folder01Icon} strokeWidth={1.5} className="size-5" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative z-20 size-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 pointer-events-auto"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteTarget(ws);
                      }}
                      title="Delete workspace"
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={1.5} className="size-4" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg tracking-tight text-foreground/90 transition-colors group-hover:text-primary">
                      {ws.title}
                    </h3>
                    <p className="text-[13px] text-muted-foreground/80 line-clamp-2 mt-1.5 leading-relaxed">
                      {ws.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mt-6 flex items-center justify-end pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    Open
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={1.5} className="size-4" />
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
              className="flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/40 bg-transparent p-5 text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-card/30 hover:text-foreground"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border-2 border-dashed border-border/50">
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={1.5} className="size-5" />
              </div>
              <span className="text-sm">New workspace</span>
            </button>
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
