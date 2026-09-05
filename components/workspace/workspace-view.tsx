"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { BookOpen01Icon, SparkleIcon } from "@hugeicons/core-free-icons";

import { SidebarSources } from "@/components/sources/sidebar-sources";
import { SidebarSourcesRail } from "@/components/sources/sidebar-sources-rail";
import { SidebarArtifacts } from "@/components/artifacts/sidebar-artifacts";
import { SidebarArtifactsRail } from "@/components/artifacts/sidebar-artifacts-rail";
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
 * - Mobile: Native bottom tab bar switching between Sources, Chat, and Studio with edge-to-edge views
 * - Desktop: 3-panel resizable rails with center stage Chat
 */
export function WorkspaceView({ workspaceId }: WorkspaceViewProps) {
  const {
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    mobileTab,
    setMobileTab,
    importDialogOpen,
    setImportDialogOpen,
  } = useWorkspacePanel();

  const { setPreviewArtifactId } = useWorkspacePreview();

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
    maxWidth: 560,
    side: "left",
  });

  const rightResize = usePanelResize({
    id: "sidebar-right",
    initialWidth: 320,
    minWidth: 280,
    maxWidth: 600,
    side: "right",
  });

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* 1. Global Workspace Topbar */}
      <WorkspaceTopbar
        workspaceId={workspaceId}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMemories={() => setMemoriesOpen(true)}
      />

      {/* 2. Workspace Body */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden p-0 md:px-2.5 md:pb-2.5 md:pt-0 bg-background">
        {/* ── Left Rail (Sources) Desktop ─────────────────────────────────── */}
        {leftOpen ? (
          <div
            className="relative hidden shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs md:flex md:flex-col z-10 animate-in slide-in-from-left-2 duration-200"
            style={{ width: leftResize.width }}
          >
            <SidebarSources
              workspaceId={workspaceId}
              onClose={() => setLeftOpen(false)}
            />
          </div>
        ) : (
          <div className="hidden md:flex shrink-0 mr-2.5">
            <SidebarSourcesRail
              workspaceId={workspaceId}
              onExpand={() => setLeftOpen(true)}
            />
          </div>
        )}

        {/* ── Left Resize Gutter & Handle (between Left Rail and Center Section) ── */}
        {leftOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={leftResize.width}
            onMouseDown={leftResize.onMouseDown}
            className="group relative hidden md:flex h-full w-2.5 shrink-0 cursor-col-resize items-center justify-center select-none touch-none z-20"
            title="Drag to resize sources rail"
          >
            {/* Extended invisible hit area for easy grabbing */}
            <div className="absolute inset-y-0 -inset-x-1.5 z-10" />
            <div
              className={cn(
                "h-8 w-1 rounded-full transition-colors",
                leftResize.isDragging
                  ? "bg-primary"
                  : "bg-border/80 group-hover:bg-primary/60",
              )}
            />
          </div>
        )}

        {/* ── Center Stage Desktop / Mobile Active Surface ── */}
        <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-none md:rounded-xl border-x-0 md:border border-y-0 md:border-y border-border/80 bg-card shadow-none md:shadow-xs">
          {/* Mobile Tab Surfaces (md:hidden) */}
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:hidden">
            {mobileTab === "sources" ? (
              <SidebarSources workspaceId={workspaceId} />
            ) : mobileTab === "studio" ? (
              <SidebarArtifacts workspaceId={workspaceId} />
            ) : (
              <ChatView workspaceId={workspaceId} />
            )}
          </div>

          {/* Desktop Center Stage (hidden md:flex) */}
          <div className="relative hidden md:flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <ChatView workspaceId={workspaceId} />
          </div>
        </main>

        {/* ── Right Resize Gutter & Handle (between Center Section and Right Rail) ── */}
        {rightOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={rightResize.width}
            onMouseDown={rightResize.onMouseDown}
            className="group relative hidden md:flex h-full w-2.5 shrink-0 cursor-col-resize items-center justify-center select-none touch-none z-20"
            title="Drag to resize studio rail"
          >
            {/* Extended invisible hit area for easy grabbing */}
            <div className="absolute inset-y-0 -inset-x-1.5 z-10" />
            <div
              className={cn(
                "h-8 w-1 rounded-full transition-colors",
                rightResize.isDragging
                  ? "bg-primary"
                  : "bg-border/80 group-hover:bg-primary/60",
              )}
            />
          </div>
        )}

        {/* ── Right Rail (Studio / Artifacts) Desktop ─────────────────────── */}
        {rightOpen ? (
          <div
            className="relative hidden shrink-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs md:flex md:flex-col z-10 animate-in slide-in-from-right-2 duration-200"
            style={{ width: rightResize.width }}
          >
            <SidebarArtifacts
              workspaceId={workspaceId}
              onClose={() => setRightOpen(false)}
            />
          </div>
        ) : (
          <div className="hidden md:flex shrink-0 ml-2.5">
            <SidebarArtifactsRail
              workspaceId={workspaceId}
              onExpand={() => setRightOpen(true)}
              onPreviewArtifact={(id) => {
                setRightOpen(true);
                setPreviewArtifactId(id);
              }}
            />
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Navigation Bar (md:hidden) ────────────────────── */}
      <nav
        aria-label="Workspace navigation"
        className="shrink-0 md:hidden border-t border-border/60 bg-card/95 backdrop-blur-md px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] z-30 transition-all"
      >
        <div className="grid grid-cols-3 gap-1">
          {/* 1. Sources Tab */}
          <button
            type="button"
            onClick={() => setMobileTab("sources")}
            className={cn(
              "relative flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 min-h-[44px]",
              mobileTab === "sources"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <div className="relative flex items-center justify-center">
              <HugeiconsIcon
                icon={BookOpen01Icon}
                strokeWidth={mobileTab === "sources" ? 2 : 1.5}
                className="size-5"
              />
              {sources && sources.length > 0 && (
                <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground px-1 font-mono text-[9px] font-bold">
                  {sources.length}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Sources</span>
          </button>

          {/* 2. Chat Tab */}
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={cn(
              "relative flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 min-h-[44px]",
              mobileTab === "chat"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <div className="relative flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={mobileTab === "chat" ? 2 : 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Chat</span>
          </button>

          {/* 3. Studio / Artifacts Tab */}
          <button
            type="button"
            onClick={() => setMobileTab("studio")}
            className={cn(
              "relative flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-95 min-h-[44px]",
              mobileTab === "studio"
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground font-medium",
            )}
          >
            <div className="relative flex items-center justify-center">
              <HugeiconsIcon
                icon={SparkleIcon}
                strokeWidth={mobileTab === "studio" ? 2 : 1.5}
                className="size-5"
              />
              {artifacts && artifacts.length > 0 && (
                <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground px-1 font-mono text-[9px] font-bold">
                  {artifacts.length}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Studio</span>
          </button>
        </div>
      </nav>

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

