"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  ArrowRight01Icon,
  Delete01Icon,
  PlusSignIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

import * as React from "react";
import Link from "next/link";

import type { Workspace } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { useWorkspaces, useDeleteWorkspace } from "@/hooks/use-workspaces";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { CreateWorkspaceDialog } from "@/components/shell/create-workspace-dialog";
import { EditWorkspaceDialog } from "@/components/shell/edit-workspace-dialog";
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
  const [editTarget, setEditTarget] = React.useState<Workspace | null>(null);

  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "";

  const greetingPrefix = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

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

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-3.5 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12">
        {/* Hero Section */}
        <section className="relative mb-6 sm:mb-8 md:mb-10 flex flex-col items-start pt-2 sm:pt-4">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            {greetingPrefix}
            {firstName ? (
              <>
                , <span className="text-primary">{firstName}</span>
              </>
            ) : null}
          </h1>
        </section>

        {/* Workspace Grid */}
        <section className="flex flex-col">
          {workspaces && workspaces.length > 0 ? (
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* New Workspace Tile */}
              <button
                onClick={() => setCreateOpen(true)}
                type="button"
                className="group relative flex min-h-[11rem] sm:min-h-[12rem] cursor-pointer flex-col justify-between rounded-2xl border-2 border-dashed border-foreground/30 bg-card/80 p-4 sm:p-5 text-left shadow-sm transition-colors duration-200 hover:border-foreground/45 hover:bg-card/95"
              >
                <div className="flex size-10 sm:size-11 items-center justify-center rounded-xl border border-foreground/30 bg-background text-black dark:text-white shadow-xs transition-colors duration-200 group-hover:border-foreground/50">
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    strokeWidth={2.2}
                    className="size-5"
                  />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold tracking-tight text-black dark:text-white">
                    New Workspace
                  </h3>
                  <p className="font-inter text-muted-foreground mt-1 line-clamp-2 text-xs sm:text-[13px] leading-relaxed font-normal">
                    Create a new workspace to organize sources, notes, and AI conversations.
                  </p>
                </div>
              </button>

              {/* Workspace Cards */}
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-blue-950 p-4 sm:p-5 shadow-sm"
                >
                  {/* Card Background Image */}
                  <div
                    className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/workspace-card-bg.jpg')" }}
                  />

                  <div className="pointer-events-none relative z-20 flex flex-col gap-4">
                    <div className="pointer-events-none flex items-center justify-between">
                      <HugeiconsIcon
                        icon={Folder01Icon}
                        strokeWidth={1.5}
                        className="size-7 text-white"
                      />

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="pointer-events-auto relative z-20 size-8 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            title="Workspace options"
                          >
                            <HugeiconsIcon
                              icon={MoreHorizontalIcon}
                              strokeWidth={1.5}
                              className="size-4"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => setEditTarget(ws)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleteTarget(ws)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-white">
                        {ws.title}
                      </h3>
                      <p className="font-inter mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/80 font-normal">
                        {ws.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="pointer-events-none relative z-10 mt-8 flex items-center justify-between text-xs font-medium">
                    <span className="text-white/60">
                      {new Date(ws.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1 text-white">
                      Open
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={1.5}
                        className="size-3.5 text-white"
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
            <div className="relative mt-4 sm:mt-8 flex flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-20 text-center">
              <div className="flex flex-col items-center">
                <HugeiconsIcon
                  icon={Folder01Icon}
                  strokeWidth={1.5}
                  className="mb-4 size-12 text-muted-foreground/60"
                />
                <h3 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  Your desk is clear
                </h3>
                <p className="font-inter font-normal mt-2.5 mb-8 max-w-md text-sm text-muted-foreground leading-relaxed">
                  Create your first knowledge workspace to start organizing sources, notes, and sparking AI conversations.
                </p>
                <Button
                  onClick={() => setCreateOpen(true)}
                  size="lg"
                  className="h-11 rounded-xl px-6 text-sm font-medium shadow-sm gap-2"
                >
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  Create your first Workspace
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Dialogs */}
        <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
        <EditWorkspaceDialog
          workspace={editTarget}
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
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
