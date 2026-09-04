"use client";

import * as React from "react";
import type { Source } from "@/lib/api";

export type WorkspaceViewMode = "chat" | "split" | "studio";

interface WorkspacePanelContextType {
  leftOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  toggleLeftOpen: () => void;
  rightOpen: boolean;
  setRightOpen: (open: boolean) => void;
  toggleRightOpen: () => void;
  mobileLeftOpen: boolean;
  setMobileLeftOpen: (open: boolean) => void;
  mobileRightOpen: boolean;
  setMobileRightOpen: (open: boolean) => void;
  viewMode: WorkspaceViewMode;
  setViewMode: (mode: WorkspaceViewMode) => void;
  importDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
}

interface WorkspacePreviewContextType {
  previewSource: Source | null;
  setPreviewSource: (source: Source | null) => void;
  previewArtifactId: string | null;
  setPreviewArtifactId: (id: string | null) => void;
  previewExpanded: boolean;
  setPreviewExpanded: (
    expanded: boolean | ((prev: boolean) => boolean),
  ) => void;
  togglePreviewExpanded: () => void;
  closePreview: () => void;
}

const WorkspacePanelContext =
  React.createContext<WorkspacePanelContextType | null>(null);

const WorkspacePreviewContext =
  React.createContext<WorkspacePreviewContextType | null>(null);

/**
 * Tracks workspace layout state:
 * - Sources (left) and Studio/Artifacts (right) panels
 * - View modes: 'chat' | 'split' | 'studio'
 * - Preview pane (active source or artifact, expanded canvas state)
 * - Mobile drawers and global shortcut orchestration (Cmd+B, Cmd+J, Cmd+E, Esc)
 */
export function WorkspacePanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Desktop sidebars: Sources starts open; Studio starts closed to give generous breathing room
  const [leftOpen, setLeftOpenInternal] = React.useState(true);
  const [rightOpen, setRightOpenInternal] = React.useState(false);

  // Mobile drawers (closed by default on mobile)
  const [mobileLeftOpen, setMobileLeftOpenInternal] = React.useState(false);
  const [mobileRightOpen, setMobileRightOpenInternal] = React.useState(false);

  // Active preview
  const [previewSource, setPreviewSourceInternal] =
    React.useState<Source | null>(null);
  const [previewArtifactId, setPreviewArtifactIdInternal] = React.useState<
    string | null
  >(null);

  // Expanded canvas state (when preview fills the central work surface)
  const [previewExpanded, setPreviewExpanded] = React.useState(false);

  // View mode
  const [viewMode, setViewModeInternal] =
    React.useState<WorkspaceViewMode>("chat");

  // Global import modal state
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);

  // Close mobile overlays on desktop breakpoint resize
  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setMobileLeftOpenInternal(false);
        setMobileRightOpenInternal(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setLeftOpen = React.useCallback((open: boolean) => {
    setLeftOpenInternal(open);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileLeftOpenInternal(open);
      if (open) setMobileRightOpenInternal(false);
    }
  }, []);

  const toggleLeftOpen = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileLeftOpenInternal((prev) => !prev);
      setMobileRightOpenInternal(false);
    } else {
      setLeftOpenInternal((prev) => !prev);
    }
  }, []);

  const setRightOpen = React.useCallback((open: boolean) => {
    setRightOpenInternal(open);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileRightOpenInternal(open);
      if (open) setMobileLeftOpenInternal(false);
    }
  }, []);

  const toggleRightOpen = React.useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileRightOpenInternal((prev) => !prev);
      setMobileLeftOpenInternal(false);
    } else {
      setRightOpenInternal((prev) => !prev);
    }
  }, []);

  const setMobileLeftOpen = React.useCallback((open: boolean) => {
    setMobileLeftOpenInternal(open);
    if (open) {
      setMobileRightOpenInternal(false);
    }
  }, []);

  const setMobileRightOpen = React.useCallback((open: boolean) => {
    setMobileRightOpenInternal(open);
    if (open) {
      setMobileLeftOpenInternal(false);
    }
  }, []);

  const closePreview = React.useCallback(() => {
    setPreviewSourceInternal(null);
    setPreviewArtifactIdInternal(null);
    setPreviewExpanded(false);
    setViewModeInternal("chat");
  }, []);

  const togglePreviewExpanded = React.useCallback(() => {
    setPreviewExpanded((prev) => {
      const next = !prev;
      setViewModeInternal(next ? "studio" : "split");
      return next;
    });
  }, []);

  const setPreviewSource = React.useCallback(
    (source: Source | null) => {
      setPreviewSourceInternal(source);
      if (source) {
        setPreviewArtifactIdInternal(null);
        setViewModeInternal((curr) => (curr === "studio" ? "studio" : "split"));
        // Prevent 4-column squeeze on standard viewports: collapse right rail if open
        if (typeof window !== "undefined" && window.innerWidth < 1440) {
          setRightOpenInternal(false);
        }
      } else {
        setViewModeInternal("chat");
        setPreviewExpanded(false);
      }
    },
    [],
  );

  const setPreviewArtifactId = React.useCallback(
    (id: string | null) => {
      setPreviewArtifactIdInternal(id);
      if (id) {
        setPreviewSourceInternal(null);
        setViewModeInternal((curr) => (curr === "studio" ? "studio" : "split"));
        // Prevent 4-column squeeze on standard viewports: collapse right rail if open
        if (typeof window !== "undefined" && window.innerWidth < 1440) {
          setRightOpenInternal(false);
        }
      } else {
        setViewModeInternal("chat");
        setPreviewExpanded(false);
      }
    },
    [],
  );

  const setViewMode = React.useCallback(
    (mode: WorkspaceViewMode) => {
      setViewModeInternal(mode);
      if (mode === "studio") {
        setPreviewExpanded(true);
      } else if (mode === "split") {
        setPreviewExpanded(false);
      } else if (mode === "chat") {
        setPreviewExpanded(false);
      }
    },
    [],
  );

  // Global Keyboard Shortcuts (Cmd+B, Cmd+J, Cmd+E, Esc)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isTyping =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Cmd/Ctrl + B: Toggle Sources
      if (cmdKey && e.key.toLowerCase() === "b" && !e.shiftKey) {
        e.preventDefault();
        toggleLeftOpen();
        return;
      }

      // Cmd/Ctrl + J: Toggle Studio / Artifacts
      if (cmdKey && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggleRightOpen();
        return;
      }

      // Cmd/Ctrl + E: Toggle Preview Expand / Restore
      if (cmdKey && e.key.toLowerCase() === "e") {
        if (previewSource || previewArtifactId) {
          e.preventDefault();
          togglePreviewExpanded();
          return;
        }
      }

      // Esc: Close preview or mobile sheets
      if (e.key === "Escape" && !isTyping) {
        if (previewSource || previewArtifactId) {
          closePreview();
        } else if (mobileLeftOpen) {
          setMobileLeftOpen(false);
        } else if (mobileRightOpen) {
          setMobileRightOpen(false);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    toggleLeftOpen,
    toggleRightOpen,
    togglePreviewExpanded,
    closePreview,
    previewSource,
    previewArtifactId,
    mobileLeftOpen,
    mobileRightOpen,
    setMobileLeftOpen,
    setMobileRightOpen,
  ]);

  const panelValue = React.useMemo(
    () => ({
      leftOpen,
      setLeftOpen,
      toggleLeftOpen,
      rightOpen,
      setRightOpen,
      toggleRightOpen,
      mobileLeftOpen,
      setMobileLeftOpen,
      mobileRightOpen,
      setMobileRightOpen,
      viewMode,
      setViewMode,
      importDialogOpen,
      setImportDialogOpen,
    }),
    [
      leftOpen,
      setLeftOpen,
      toggleLeftOpen,
      rightOpen,
      setRightOpen,
      toggleRightOpen,
      mobileLeftOpen,
      setMobileLeftOpen,
      mobileRightOpen,
      setMobileRightOpen,
      viewMode,
      setViewMode,
      importDialogOpen,
      setImportDialogOpen,
    ],
  );

  const previewValue = React.useMemo(
    () => ({
      previewSource,
      setPreviewSource,
      previewArtifactId,
      setPreviewArtifactId,
      previewExpanded,
      setPreviewExpanded,
      togglePreviewExpanded,
      closePreview,
    }),
    [
      previewSource,
      setPreviewSource,
      previewArtifactId,
      setPreviewArtifactId,
      previewExpanded,
      setPreviewExpanded,
      togglePreviewExpanded,
      closePreview,
    ],
  );

  return (
    <WorkspacePanelContext.Provider value={panelValue}>
      <WorkspacePreviewContext.Provider value={previewValue}>
        {children}
      </WorkspacePreviewContext.Provider>
    </WorkspacePanelContext.Provider>
  );
}

export function useWorkspacePanel(): WorkspacePanelContextType {
  const context = React.useContext(WorkspacePanelContext);
  if (!context) {
    throw new Error(
      "useWorkspacePanel must be used within WorkspacePanelProvider",
    );
  }
  return context;
}

export function useWorkspacePreview(): WorkspacePreviewContextType {
  const context = React.useContext(WorkspacePreviewContext);
  if (!context) {
    throw new Error(
      "useWorkspacePreview must be used within WorkspacePanelProvider",
    );
  }
  return context;
}

