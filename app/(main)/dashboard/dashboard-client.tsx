"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Folder01Icon,
  ArrowRight01Icon,
  Delete01Icon,
  PlusSignIcon,
  MoreHorizontalIcon,
  Search01Icon,
  Cancel01Icon,
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [modifierKey, setModifierKey] = React.useState("⌘K");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const { data: session } = authClient.useSession();
  const firstName = session?.user?.name ? session.user.name.split(" ")[0] : "";

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent)
    ) {
      setModifierKey("Ctrl+K");
    }
  }, []);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const greetingPrefix = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const filteredWorkspaces = React.useMemo(() => {
    if (!workspaces) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return workspaces;
    return workspaces.filter((ws) => {
      const titleMatch = ws.title.toLowerCase().includes(query);
      const descMatch = ws.description
        ? ws.description.toLowerCase().includes(query)
        : false;
      return titleMatch || descMatch;
    });
  }, [workspaces, searchQuery]);

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

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-3.5 py-6 sm:px-4 sm:py-8 md:px-8 md:py-12 pb-safe">
        {/* Header & Search Controls */}
        <section className="relative mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pt-2 sm:pt-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              {greetingPrefix}
              {firstName ? (
                <>
                  , <span className="text-primary">{firstName}</span>
                </>
              ) : null}
            </h1>
            {workspaces && workspaces.length > 0 ? (
              <p className="font-inter text-muted-foreground mt-1 text-xs sm:text-sm">
                {searchQuery.trim()
                  ? `Showing ${filteredWorkspaces.length} of ${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}`
                  : `${workspaces.length} workspace${workspaces.length === 1 ? "" : "s"}`}
              </p>
            ) : null}
          </div>

          {workspaces && workspaces.length > 0 ? (
            <div className="group relative flex w-full sm:w-auto items-center">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={1.8}
                className="pointer-events-none absolute left-3 size-4 text-muted-foreground transition-colors group-focus-within:text-primary"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="h-9 w-full rounded-xl border border-border bg-card/80 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground/70 shadow-2xs transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-64 md:w-72"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 hidden select-none items-center rounded border border-border/80 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
                  {modifierKey}
                </kbd>
              )}
            </div>
          ) : null}
        </section>

        {/* Workspace Grid */}
        <section className="flex flex-col">
          {!workspaces || workspaces.length === 0 ? (
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
          ) : searchQuery.trim() && filteredWorkspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-4 py-12 sm:py-16 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={1.5}
                  className="size-5"
                />
              </div>
              <h3 className="font-heading mt-3.5 text-base sm:text-lg font-semibold text-foreground">
                No workspaces found
              </h3>
              <p className="font-inter mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No workspaces matched &ldquo;{searchQuery}&rdquo;. Try a different search term or clear the filter.
              </p>
              <div className="mt-5 flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="h-8.5 rounded-lg px-3.5 text-xs font-medium cursor-pointer"
                >
                  Clear search
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                  className="h-8.5 rounded-lg px-3.5 text-xs font-medium gap-1.5 cursor-pointer"
                >
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  New Workspace
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* New Workspace Tile only when not filtering */}
              {!searchQuery.trim() ? (
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
                ) : null}

                {/* Workspace Cards */}
                {filteredWorkspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/15 bg-card p-4 sm:p-5 shadow-sm"
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
                            className="pointer-events-auto relative z-20 size-9 sm:size-8 rounded-lg text-white/75 transition-colors hover:bg-white/20 hover:text-white active:scale-95 touch-manipulation"
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
