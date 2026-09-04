"use client";

import * as React from "react";

import { SidebarSources } from "@/components/sources/sidebar-sources";
import { SidebarSourcesRail } from "@/components/sources/sidebar-sources-rail";
import { SourcePreview } from "@/components/sources/source-preview";
import { SidebarArtifacts } from "@/components/artifacts/sidebar-artifacts";
import { SidebarArtifactsRail } from "@/components/artifacts/sidebar-artifacts-rail";
import { ArtifactPreview } from "@/components/artifacts/artifact-preview";
import { ChatView } from "@/components/chat/chat-view";
import { EditWorkspaceDialog } from "@/components/shell/edit-workspace-dialog";
import { MemoriesSheet } from "@/components/memories/memories-sheet";
import { ImportSourceDialog } from "@/components/sources/import-dialog";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { useSources } from "@/hooks/use-sources";
import { useArtifacts } from "@/hooks/use-artifacts";
import {
  useWorkspacePanel,
  useWorkspacePreview,
} from "@/components/shell/workspace-panel-context";
import { WorkspaceTopbar } from "./workspace-topbar";
import { usePanelResize } from "@/hooks/use-panel-resize";
import { cn } from "@/lib/utils";

interface WorkspaceViewProps {
  workspaceId: string;
}

/**
 * Modernized Adaptive Workspace:
 * - Left Rail: Sources & Library (resizable on desktop, slide drawer on mobile)
 * - Center Stage: Adaptive Work Surface (Chat / Split / Full Studio Canvas)
 * - Right Rail: Studio & Learning Artifacts (resizable on desktop, slide drawer on mobile)
 * - Topbar: Unified command & control header with view switcher and shortcuts
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
    viewMode,
    importDialogOpen,
    setImportDialogOpen,
  } = useWorkspacePanel();

  const {
    previewSource,
    previewArtifactId,
    setPreviewArtifactId,
    previewExpanded,
    closePreview,
  } = useWorkspacePreview();

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [memoriesOpen, setMemoriesOpen] = React.useState(false);

  const { data: workspace } = useWorkspaceContext();
  const { data: sources } = useSources(workspaceId);
  const { data: artifacts } = useArtifacts(workspaceId);

  // Resizing hooks with local storage persistence
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
    initialWidth: 620,
    minWidth: 340,
    maxWidth: 1100,
    side: "left",
  });

  const hasPreview = !!previewSource || !!previewArtifactId;

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* 1. Global Workspace Topbar */}
      <WorkspaceTopbar
        workspaceId={workspaceId}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMemories={() => setMemoriesOpen(true)}
      />

      {/* 2. Workspace Body (NotebookLM style 3-panel separated surface layout) */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden px-2 pb-2 md:px-2.5 md:pb-2.5 pt-0 gap-2 md:gap-2.5 bg-background">
        {/* ── Left Rail (Sources) Desktop ─────────────────────────────────── */}
        {leftOpen ? (
          <div
            className="relative hidden shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs md:flex md:flex-col z-20 animate-in slide-in-from-left-2 duration-200"
            style={{ width: leftResize.width }}
          >
            <SidebarSources
              workspaceId={workspaceId}
              onClose={() => setLeftOpen(false)}
            />
            {/* Drag Handle */}
            <div
              onMouseDown={leftResize.onMouseDown}
              className="hover:bg-primary/20 active:bg-primary/40 group absolute top-0 -right-1 z-10 flex h-full w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors"
              title="Drag to resize sources rail"
            >
              <div className="bg-border/80 group-hover:bg-primary/60 h-8 w-0.5 rounded-full transition-colors" />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex shrink-0">
            <SidebarSourcesRail
              workspaceId={workspaceId}
              onExpand={() => setLeftOpen(true)}
            />
          </div>
        )}

        {/* Mobile Left Overlay */}
        {mobileLeftOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileLeftOpen(false)}
              aria-hidden
            />
            <div className="bg-card animate-in slide-in-from-left absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col shadow-2xl duration-200 pb-[env(safe-area-inset-bottom)]">
              <SidebarSources
                workspaceId={workspaceId}
                onClose={() => setMobileLeftOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ── Center Stage: Adaptive Work Surface (Chat / Split / Canvas) ── */}
        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
          <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
            {hasPreview ? (
              <>
                {/* Full Studio Canvas Mode: Preview takes 100% of the surface */}
                {viewMode === "studio" || previewExpanded ? (
                  <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col animate-in fade-in duration-200">
                    {previewSource ? (
                      <SourcePreview
                        source={previewSource}
                        onClose={closePreview}
                      />
                    ) : previewArtifactId ? (
                      <ArtifactPreview
                        workspaceId={workspaceId}
                        artifactId={previewArtifactId}
                        onClose={closePreview}
                      />
                    ) : null}
                  </div>
                ) : (
                  /* Split Mode: Preview + Chat side-by-side */
                  <>
                    <div
                      className="border-border/50 relative flex min-h-0 w-full shrink-0 flex-col border-b h-[45vh] md:h-full md:w-[var(--preview-width)] md:border-r md:border-b-0 animate-in slide-in-from-left-2 duration-200"
                      style={
                        {
                          "--preview-width": `${previewResize.width}px`,
                        } as React.CSSProperties
                      }
                    >
                      {previewSource ? (
                        <SourcePreview
                          source={previewSource}
                          onClose={closePreview}
                        />
                      ) : previewArtifactId ? (
                        <ArtifactPreview
                          workspaceId={workspaceId}
                          artifactId={previewArtifactId}
                          onClose={closePreview}
                        />
                      ) : null}
                      {/* Drag Handle */}
                      <div
                        onMouseDown={previewResize.onMouseDown}
                        className="hover:bg-primary/20 active:bg-primary/40 group absolute top-0 right-0 z-10 hidden h-full w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors md:flex"
                        title="Drag to resize split view"
                      >
                        <div className="bg-border/80 group-hover:bg-primary/60 h-8 w-0.5 rounded-full transition-colors" />
                      </div>
                    </div>

                    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                      <ChatView workspaceId={workspaceId} />
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Pure Chat Mode */
              <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                <ChatView workspaceId={workspaceId} />
              </div>
            )}
          </div>
        </main>

        {/* ── Right Rail (Studio / Artifacts) Desktop ─────────────────────── */}
        {rightOpen ? (
          <div
            className="relative hidden shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs md:flex md:flex-col z-20 animate-in slide-in-from-right-2 duration-200"
            style={{ width: rightResize.width }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={rightResize.onMouseDown}
              className="hover:bg-primary/20 active:bg-primary/40 group absolute top-0 -left-1 z-10 flex h-full w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors"
              title="Drag to resize artifacts rail"
            >
              <div className="bg-border/80 group-hover:bg-primary/60 h-8 w-0.5 rounded-full transition-colors" />
            </div>
            <SidebarArtifacts
              workspaceId={workspaceId}
              onClose={() => setRightOpen(false)}
              onPreviewArtifact={(id) => setPreviewArtifactId(id)}
            />
          </div>
        ) : (
          <div className="hidden md:flex shrink-0">
            <SidebarArtifactsRail
              workspaceId={workspaceId}
              onExpand={() => setRightOpen(true)}
              onPreviewArtifact={(id) => setPreviewArtifactId(id)}
            />
          </div>
        )}

        {/* Mobile Right Overlay */}
        {mobileRightOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileRightOpen(false)}
              aria-hidden
            />
            <div className="bg-background animate-in slide-in-from-right absolute inset-y-0 right-0 flex w-[86vw] max-w-sm flex-col shadow-2xl duration-200 pb-[env(safe-area-inset-bottom)]">
              <SidebarArtifacts
                workspaceId={workspaceId}
                onClose={() => setMobileRightOpen(false)}
                onPreviewArtifact={(id) => setPreviewArtifactId(id)}
              />

            </div>
          </div>
        )}
      </div>

      {/* 3. Global Dialogs & Sheets */}
      <ImportSourceDialog
        workspaceId={workspaceId}
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
      <EditWorkspaceDialog
        workspace={workspace ?? null}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <MemoriesSheet open={memoriesOpen} onOpenChange={setMemoriesOpen} />
    </div>
  );
}

