"use client";

import * as React from "react";

import { SidebarSources } from "@/components/sources/sidebar-sources";
import { SourcePreview } from "@/components/sources/source-preview";
import { SidebarArtifacts } from "@/components/artifacts/sidebar-artifacts";
import { ArtifactPreview } from "@/components/artifacts/artifact-preview";
import { ChatView } from "@/components/chat/chat-view";
import { EditWorkspaceDialog } from "@/components/shell/edit-workspace-dialog";
import { MemoriesSheet } from "@/components/memories/memories-sheet";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { useSources } from "@/hooks/use-sources";
import { useArtifacts } from "@/hooks/use-artifacts";
import {
  useWorkspacePanel,
  useWorkspacePreview,
} from "@/components/shell/workspace-panel-context";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeftIcon, SidebarRightIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { WorkspaceTopbar } from "./workspace-topbar";
import { usePanelResize } from "@/hooks/use-panel-resize";
import { cn } from "@/lib/utils";

interface WorkspaceViewProps {
  workspaceId: string;
}

/**
 * Three-column workspace:
 * - Left panel: Sources (resizable on desktop, overlay drawer on mobile)
 * - Center: Chat (flex-1)
 * - Right panel: Artifacts (resizable on desktop, overlay drawer on mobile)
 * Includes mobile overlay states and topbar orchestration.
 */
export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    mobileLeftOpen,
    setMobileLeftOpen,
    mobileRightOpen,
    setMobileRightOpen,
  } = useWorkspacePanel();
  const {
    previewSource,
    setPreviewSource,
    previewArtifactId,
    setPreviewArtifactId,
  } = useWorkspacePreview();

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [memoriesOpen, setMemoriesOpen] = React.useState(false);

  const { data: workspace } = useWorkspaceContext();
  const { data: sources } = useSources(workspaceId);
  const { data: artifacts } = useArtifacts(workspaceId);

  // Resizing hooks
  const leftResize = usePanelResize({
    id: "sidebar-left",
    initialWidth: 280,
    minWidth: 240,
    maxWidth: 420,
    side: "left",
  });

  const rightResize = usePanelResize({
    id: "sidebar-right",
    initialWidth: 320,
    minWidth: 280,
    maxWidth: 480,
    side: "right",
  });

  const previewResize = usePanelResize({
    id: "preview-panel",
    initialWidth: 600,
    minWidth: 320,
    maxWidth: 1200,
    side: "left",
  });

  const hasPreview = !!previewSource || !!previewArtifactId;

  // Handle Escape key to dismiss preview pane or close open sidebars
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (previewSource || previewArtifactId) {
          setPreviewSource(null);
          setPreviewArtifactId(null);
        } else if (mobileLeftOpen) {
          setMobileLeftOpen(false);
        } else if (mobileRightOpen) {
          setMobileRightOpen(false);
        } else if (leftOpen) {
          setLeftOpen(false);
        } else if (rightOpen) {
          setRightOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    previewSource,
    previewArtifactId,
    leftOpen,
    rightOpen,
    mobileLeftOpen,
    mobileRightOpen,
    setPreviewSource,
    setPreviewArtifactId,
    setLeftOpen,
    setRightOpen,
    setMobileLeftOpen,
    setMobileRightOpen,
  ]);

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* Topbar */}
      <WorkspaceTopbar
        workspaceId={workspaceId}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMemories={() => setMemoriesOpen(true)}
      />

      {/* Three-column body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Floating Left Toggle: Open Sources (Visible when desktop left panel or mobile left drawer is closed) */}
        {(!leftOpen || !mobileLeftOpen) && (
          <div
            className={cn(
              "absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-30 animate-in fade-in zoom-in-95 duration-200",
              leftOpen ? "flex md:hidden" : "flex",
              mobileLeftOpen ? "hidden md:flex" : ""
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLeftOpen(true);
                setMobileLeftOpen(true);
              }}
              aria-label="Open sources panel"
              className="h-8 gap-1.5 sm:gap-2 rounded-xl border-border/60 bg-background/85 px-2 sm:px-3 text-xs font-medium text-foreground backdrop-blur-md shadow-xs transition-all hover:bg-background hover:border-primary/40 hover:shadow-sm"
            >
              <HugeiconsIcon
                icon={SidebarLeftIcon}
                strokeWidth={1.5}
                className="size-3.5 text-muted-foreground"
              />
              <span className="hidden sm:inline">Sources</span>
              {sources && sources.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">
                  {sources.length}
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Floating Right Toggle: Open Artifacts (Visible when desktop right panel or mobile right drawer is closed) */}
        {(!rightOpen || !mobileRightOpen) && (
          <div
            className={cn(
              "absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 animate-in fade-in zoom-in-95 duration-200",
              rightOpen ? "flex md:hidden" : "flex",
              mobileRightOpen ? "hidden md:flex" : ""
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRightOpen(true);
                setMobileRightOpen(true);
              }}
              aria-label="Open artifacts panel"
              className="h-8 gap-1.5 sm:gap-2 rounded-xl border-border/60 bg-background/85 px-2 sm:px-3 text-xs font-medium text-foreground backdrop-blur-md shadow-xs transition-all hover:bg-background hover:border-primary/40 hover:shadow-sm"
            >
              <span className="hidden sm:inline">Artifacts</span>
              {artifacts && artifacts.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono leading-none text-muted-foreground">
                  {artifacts.length}
                </span>
              )}
              <HugeiconsIcon
                icon={SidebarRightIcon}
                strokeWidth={1.5}
                className="size-3.5 text-muted-foreground"
              />
            </Button>
          </div>
        )}

        {/* ── Left Panel (Sources) Desktop ────────────────────────────────── */}
        {leftOpen && (
          <div
            className="border-border/40 animate-in slide-in-from-left-4 relative hidden shrink-0 border-r duration-300 md:flex md:flex-col"
            style={{ width: leftResize.width }}
          >
            <SidebarSources
              workspaceId={workspaceId}
              onClose={() => setLeftOpen(false)}
            />
            {/* Drag Handle */}
            <div
              onMouseDown={leftResize.onMouseDown}
              className="hover:bg-primary/20 active:bg-primary/40 absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors"
            >
              <div className="bg-border/80 h-8 w-0.5 rounded-full" />
            </div>
          </div>
        )}

        {/* Mobile Left Overlay (Closed by default on mobile) */}
        {mobileLeftOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileLeftOpen(false)}
              aria-hidden
            />
            <div className="bg-background animate-in slide-in-from-left absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col shadow-2xl duration-300 pb-[env(safe-area-inset-bottom)]">
              <SidebarSources
                workspaceId={workspaceId}
                onClose={() => setMobileLeftOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ── Center (Chat) ────────────────────────────────────────────────── */}
        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            {hasPreview ? (
              <>
                <div
                  className="border-border/30 relative flex min-h-0 w-full shrink-0 flex-col border-b h-[45vh] md:h-full md:w-[var(--preview-width)] md:border-r md:border-b-0"
                  style={
                    {
                      "--preview-width": `${previewResize.width}px`,
                    } as React.CSSProperties
                  }
                >
                  {previewSource ? (
                    <SourcePreview
                      source={previewSource}
                      onClose={() => setPreviewSource(null)}
                    />
                  ) : previewArtifactId ? (
                    <ArtifactPreview
                      workspaceId={workspaceId}
                      artifactId={previewArtifactId}
                      onClose={() => setPreviewArtifactId(null)}
                    />
                  ) : null}
                  {/* Drag Handle */}
                  <div
                    onMouseDown={previewResize.onMouseDown}
                    className="hover:bg-primary/20 active:bg-primary/40 absolute top-0 right-0 z-10 hidden h-full w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors md:flex"
                  >
                    <div className="bg-border/80 h-8 w-0.5 rounded-full" />
                  </div>
                </div>
                <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                  <ChatView workspaceId={workspaceId} />
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                <ChatView workspaceId={workspaceId} />
              </div>
            )}
          </div>
        </main>

        {/* ── Right Panel (Artifacts) Desktop ──────────────────────────────── */}
        {rightOpen && (
          <div
            className="border-border/40 animate-in slide-in-from-right-4 relative hidden shrink-0 border-l duration-300 md:flex md:flex-col"
            style={{ width: rightResize.width }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={rightResize.onMouseDown}
              className="hover:bg-primary/20 active:bg-primary/40 absolute top-0 left-0 z-10 flex h-full w-2 -translate-x-1/2 cursor-col-resize items-center justify-center bg-transparent transition-colors"
            >
              <div className="bg-border/80 h-8 w-0.5 rounded-full" />
            </div>
            <SidebarArtifacts
              workspaceId={workspaceId}
              onClose={() => setRightOpen(false)}
              onPreviewArtifact={(id) => setPreviewArtifactId(id)}
            />
          </div>
        )}

        {/* Mobile Right Overlay (Closed by default on mobile) */}
        {mobileRightOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileRightOpen(false)}
              aria-hidden
            />
            <div className="bg-background animate-in slide-in-from-right absolute inset-y-0 right-0 flex w-[85vw] max-w-sm flex-col shadow-2xl duration-300 pb-[env(safe-area-inset-bottom)]">
              <SidebarArtifacts
                workspaceId={workspaceId}
                onClose={() => setMobileRightOpen(false)}
                onPreviewArtifact={(id) => setPreviewArtifactId(id)}
              />
            </div>
          </div>
        )}
      </div>

      <EditWorkspaceDialog
        workspace={workspace ?? null}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <MemoriesSheet open={memoriesOpen} onOpenChange={setMemoriesOpen} />
    </div>
  );
}
