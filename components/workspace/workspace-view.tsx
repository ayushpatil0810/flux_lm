"use client";

import * as React from "react";
import { Settings } from "lucide-react";

import { SidebarSources } from "@/components/sources/sidebar-sources";
import { SourcePreview } from "@/components/sources/source-preview";
import { SidebarArtifacts } from "@/components/artifacts/sidebar-artifacts";
import { ChatView } from "@/components/chat/chat-view";
import { EditWorkspaceDialog } from "@/components/shell/edit-workspace-dialog";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { useSources } from "@/hooks/use-sources";
import { useArtifacts } from "@/hooks/use-artifacts";
import { useWorkspacePanel } from "@/components/shell/workspace-panel-context";
import { cn } from "@/lib/utils";

interface WorkspaceViewProps {
  workspaceId: string;
}

/**
 * Two-column workspace: a single contextual left panel (Sources or Artifacts,
 * driven by the sidebar) plus the chat center. No right panel.
 */
export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const { activePanel, setActivePanel, previewSource, setPreviewSource } = useWorkspacePanel();

  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const { data: workspace } = useWorkspaceContext();
  const { data: sources } = useSources(workspaceId, {}, { enabled: activePanel === "sources" });
  const { data: artifacts } = useArtifacts(workspaceId, { enabled: activePanel === "artifacts" });

  const sourcesCount = sources?.length ?? 0;
  const artifactsCount = artifacts?.length ?? 0;
  const noSources = sources !== undefined && sources.length === 0;

  const panelOpen = activePanel !== null;

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-background">
      {/* Contextual left panel: Sources or Artifacts */}
      <div
        className={cn(
          "shrink-0 transition-all duration-200 ease-out",
          panelOpen
            ? "w-72 border-r border-border/30 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:bg-background max-md:shadow-2xl"
            : "w-0 overflow-hidden opacity-0"
        )}
      >
        <div className="h-full w-72 max-md:w-[85vw] max-md:max-w-72">
          {activePanel === "sources" && (
            <SidebarSources
              workspaceId={workspaceId}
              onClose={() => setActivePanel(null)}
            />
          )}
          {activePanel === "artifacts" && (
            <SidebarArtifacts
              workspaceId={workspaceId}
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      {panelOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setActivePanel(null)}
        />
      ) : null}

      {/* Center: topbar + chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border/30 px-3">
          {/* Workspace name + meta */}
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-medium leading-none text-foreground">
              {workspace?.title ?? "Workspace"}
            </h1>
            {(sources !== undefined || artifacts !== undefined) && (sourcesCount > 0 || artifactsCount > 0) && (
              <span className="hidden shrink-0 text-xs text-muted-foreground/50 sm:block">
                {[
                  sourcesCount > 0 &&
                    `${sourcesCount} ${sourcesCount === 1 ? "source" : "sources"}`,
                  artifactsCount > 0 &&
                    `${artifactsCount} ${artifactsCount === 1 ? "artifact" : "artifacts"}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>

          {/* Settings icon */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Workspace settings"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Settings className="size-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-hidden">
          {previewSource ? (
            <>
              {/* Source Preview takes remaining space */}
              <div className="flex-1 min-w-0 border-b md:border-b-0 md:border-r border-border/30">
                <SourcePreview 
                  source={previewSource} 
                  onClose={() => setPreviewSource(null)} 
                />
              </div>
              {/* Chat shrinks to a side panel on desktop */}
              <div className="flex min-h-0 shrink-0 flex-col md:w-[400px] lg:w-[450px]">
                <ChatView workspaceId={workspaceId} noSources={noSources} sourcesCount={sourcesCount} />
              </div>
            </>
          ) : (
            <div className="flex-1 min-w-0">
              <ChatView workspaceId={workspaceId} noSources={noSources} sourcesCount={sourcesCount} />
            </div>
          )}
        </div>
      </div>

      <EditWorkspaceDialog
        workspace={workspace ?? null}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
