"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  ArrowRight01Icon,
  Delete01Icon,
  PlusSignIcon,
  Clock01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import * as React from "react";
import Link from "next/link";

import type { Workspace } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
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

  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "";

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    let prefix = "Good evening";
    if (hour < 12) prefix = "Good morning";
    else if (hour < 17) prefix = "Good afternoon";
    
    return firstName ? `${prefix}, ${firstName}` : prefix;
  }, [firstName]);

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
    <div className="relative min-h-full">
      {/* Subtle background texture for the entire dashboard */}
      <div className="bg-grid absolute inset-0 z-0 opacity-[0.03] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-4 py-8 md:px-8 md:py-12">
        {/* Hero Section */}
        <section className="relative mb-12 flex flex-col items-start pt-4">
          <div className="glow-primary absolute -right-20 -top-20 -z-10 h-[400px] w-[600px] opacity-30 blur-[120px] pointer-events-none" />
          <h1 className="font-serif text-display text-foreground tracking-tight">
            {greeting}
          </h1>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl">
            Ready to pick up where you left off? Dive into your active workspaces
            or create a new one to start synthesizing your knowledge.
          </p>
        </section>

        {/* Quick Actions Row */}
        <section className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setCreateOpen(true)}
            className="group relative flex h-36 flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card p-5 text-left transition-all hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
              </div>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="text-primary size-5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1"
              />
            </div>
            <div>
              <div className="font-semibold tracking-tight text-foreground">Create Workspace</div>
              <div className="text-sm text-muted-foreground mt-0.5">Start a new project</div>
            </div>
          </button>

          <div className="col-span-1 md:col-span-2 relative flex h-36 flex-col justify-center overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-6">
            <div className="bg-noise absolute inset-0 z-0 opacity-20 mix-blend-overlay" />
            <div className="relative z-10 flex items-start gap-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={1.5} className="size-5" />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold tracking-tight text-foreground">Recent Activity</h3>
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                    <HugeiconsIcon icon={SparklesIcon} className="size-3" /> Coming Soon
                  </span>
                </div>
                <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                  Your most recent memories, artifact generations, and AI insights will be surfaced here for quick access.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Workspace Grid */}
        <section className="flex flex-col">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-title font-semibold tracking-tight text-foreground">
              Your Workspaces
            </h2>
            {workspaces && workspaces.length > 0 && (
              <span className="text-sm font-medium text-muted-foreground">
                {workspaces.length} {workspaces.length === 1 ? "workspace" : "workspaces"}
              </span>
            )}
          </div>

          {workspaces && workspaces.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 transition-all duration-300 hover:border-primary/40 hover:bg-card hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="bg-noise absolute inset-0 z-0 opacity-40 mix-blend-overlay" />
                  <div className="from-primary/10 via-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="pointer-events-none relative z-20 flex flex-col gap-4">
                    <div className="pointer-events-none flex items-center justify-between">
                      <div className="bg-primary/10 text-primary pointer-events-none flex size-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110">
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
                      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-[13px] leading-relaxed">
                        {ws.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="pointer-events-none relative z-10 mt-8 flex items-center justify-end">
                    <span className="text-primary inline-flex -translate-x-2 items-center gap-1.5 text-sm font-medium opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                      Open Workspace
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
            </div>
          ) : (
            <div className="relative mt-2 flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/40 bg-card/30 px-6 py-20 text-center shadow-sm">
              <div className="bg-noise absolute inset-0 z-0 opacity-[0.15] mix-blend-overlay" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    strokeWidth={1.5}
                    className="size-8"
                  />
                </div>
                <h3 className="font-serif text-3xl font-medium tracking-tight text-foreground">
                  Your desk is clear
                </h3>
                <p className="mt-3 mb-8 max-w-md text-base text-muted-foreground leading-relaxed">
                  Create your first knowledge workspace to start organizing sources, notes, and sparking AI conversations in one unified place.
                </p>
                <Button
                  onClick={() => setCreateOpen(true)}
                  size="lg"
                  className="rzp-button h-12 rounded-xl px-6 text-base font-medium shadow-lg"
                >
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    strokeWidth={2}
                    className="mr-2 size-5"
                  />
                  Create your first Workspace
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Dialogs */}
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
    </div>
  );
}
