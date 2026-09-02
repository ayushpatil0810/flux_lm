"use client";

import * as React from "react";

import { SidebarSources } from "@/components/sources/sidebar-sources";
import { SourcePreview } from "@/components/sources/source-preview";
import { SidebarArtifacts } from "@/components/artifacts/sidebar-artifacts";
import { ArtifactPreview } from "@/components/artifacts/artifact-preview";
import { ChatView } from "@/components/chat/chat-view";
import { EditWorkspaceDialog } from "@/components/shell/edit-workspace-dialog";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { useSources } from "@/hooks/use-sources";
import { useArtifacts } from "@/hooks/use-artifacts";
import { useWorkspacePanel, useWorkspacePreview } from "@/components/shell/workspace-panel-context";
import { WorkspaceTopbar } from "./workspace-topbar";
import { usePanelResize } from "@/hooks/use-panel-resize";

interface WorkspaceViewProps {
  workspaceId: string;
}

/**
 * Three-column workspace:
 * - Left panel: Sources (resizable)
 * - Center: Chat (flex-1)
 * - Right panel: Artifacts (resizable)
 * Includes mobile overlay states and topbar orchestration.
 */
export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
  } = useWorkspacePanel();
  const {
    previewSource,
    setPreviewSource,
    previewArtifactId,
    setPreviewArtifactId,
  } = useWorkspacePreview();

  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const { data: workspace } = useWorkspaceContext();

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

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Topbar */}
      <WorkspaceTopbar
        workspaceId={workspaceId}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Three-column body */}
      <div className="flex min-h-0 flex-1 overflow-hidden relative">
        {/* ── Left Panel (Sources) ────────────────────────────────────────── */}
        {leftOpen && (
          <div
            className="relative hidden shrink-0 border-r border-border/30 md:flex md:flex-col animate-in slide-in-from-left-4 duration-300"
            style={{ width: leftResize.width }}
          >
            <SidebarSources
              workspaceId={workspaceId}
              onClose={() => setLeftOpen(false)}
            />
            {/* Drag Handle */}
            <div
              onMouseDown={leftResize.onMouseDown}
              className="absolute right-0 top-0 z-10 flex h-full w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/40"
            >
              <div className="h-8 w-0.5 rounded-full bg-border/80" />
            </div>
          </div>
        )}

        {/* Mobile Left Overlay */}
        {leftOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setLeftOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col bg-background shadow-2xl animate-in slide-in-from-left duration-300">
              <SidebarSources
                workspaceId={workspaceId}
                onClose={() => setLeftOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ── Center (Chat) ────────────────────────────────────────────────── */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden relative">
            {hasPreview ? (
              <>
                <div
                  className="relative flex min-h-0 shrink-0 flex-col border-b border-border/30 md:border-b-0 md:border-r w-full md:w-[var(--preview-width)]"
                  style={{ "--preview-width": `${previewResize.width}px` } as React.CSSProperties}
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
                    className="absolute right-0 top-0 z-10 hidden h-full w-2 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/40 md:flex"
                  >
                    <div className="h-8 w-0.5 rounded-full bg-border/80" />
                  </div>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <ChatView
                    workspaceId={workspaceId}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 min-w-0">
                <ChatView
                  workspaceId={workspaceId}
                />
              </div>
            )}
          </div>
        </main>

        {/* ── Right Panel (Artifacts) ──────────────────────────────────────── */}
        {rightOpen && (
          <div
            className="relative hidden shrink-0 border-l border-border/30 md:flex md:flex-col animate-in slide-in-from-right-4 duration-300"
            style={{ width: rightResize.width }}
          >
            {/* Drag Handle */}
            <div
              onMouseDown={rightResize.onMouseDown}
              className="absolute left-0 top-0 z-10 flex h-full w-2 -translate-x-1/2 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/40"
            >
              <div className="h-8 w-0.5 rounded-full bg-border/80" />
            </div>
            <SidebarArtifacts
              workspaceId={workspaceId}
              onClose={() => setRightOpen(false)}
              onPreviewArtifact={(id) => setPreviewArtifactId(id)}
            />
          </div>
        )}

        {/* Mobile Right Overlay */}
        {rightOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setRightOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 right-0 flex w-[85vw] max-w-sm flex-col bg-background shadow-2xl animate-in slide-in-from-right duration-300">
              <SidebarArtifacts
                workspaceId={workspaceId}
                onClose={() => setRightOpen(false)}
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
    </div>
  );
}
