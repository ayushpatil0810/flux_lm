"use client";

import * as React from "react";
import type { Source } from "@/lib/api";

interface WorkspacePanelContextType {
  leftOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  rightOpen: boolean;
  setRightOpen: (open: boolean) => void;
  mobileLeftOpen: boolean;
  setMobileLeftOpen: (open: boolean) => void;
  mobileRightOpen: boolean;
  setMobileRightOpen: (open: boolean) => void;
}

interface WorkspacePreviewContextType {
  previewSource: Source | null;
  setPreviewSource: (source: Source | null) => void;
  previewArtifactId: string | null;
  setPreviewArtifactId: (id: string | null) => void;
}

const WorkspacePanelContext =
  React.createContext<WorkspacePanelContextType | null>(null);

const WorkspacePreviewContext =
  React.createContext<WorkspacePreviewContextType | null>(null);

/**
 * Tracks whether the Sources (left) and Artifacts (right) panels are open,
 * and which source or artifact (if any) is being previewed alongside the chat.
 *
 * Rules:
 * - Large screens (≥ 768px): Desktop sidebars are OPEN by default.
 * - Small screens (< 768px): Mobile overlay drawers are CLOSED by default so users
 *   immediately see the chat and prompt input box without overlapping overlays.
 */
export function WorkspacePanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Desktop sidebars (open by default on desktop)
  const [leftOpen, setLeftOpenInternal] = React.useState(true);
  const [rightOpen, setRightOpenInternal] = React.useState(true);

  // Mobile drawers (closed by default on mobile)
  const [mobileLeftOpen, setMobileLeftOpenInternal] = React.useState(false);
  const [mobileRightOpen, setMobileRightOpenInternal] = React.useState(false);

  const [previewSource, setPreviewSourceInternal] =
    React.useState<Source | null>(null);
  const [previewArtifactId, setPreviewArtifactIdInternal] = React.useState<
    string | null
  >(null);

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

  const setRightOpen = React.useCallback((open: boolean) => {
    setRightOpenInternal(open);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobileRightOpenInternal(open);
      if (open) setMobileLeftOpenInternal(false);
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

  const setPreviewSource = React.useCallback((source: Source | null) => {
    setPreviewSourceInternal(source);
    if (source) setPreviewArtifactIdInternal(null);
  }, []);

  const setPreviewArtifactId = React.useCallback((id: string | null) => {
    setPreviewArtifactIdInternal(id);
    if (id) setPreviewSourceInternal(null);
  }, []);

  const panelValue = React.useMemo(
    () => ({
      leftOpen,
      setLeftOpen,
      rightOpen,
      setRightOpen,
      mobileLeftOpen,
      setMobileLeftOpen,
      mobileRightOpen,
      setMobileRightOpen,
    }),
    [
      leftOpen,
      setLeftOpen,
      rightOpen,
      setRightOpen,
      mobileLeftOpen,
      setMobileLeftOpen,
      mobileRightOpen,
      setMobileRightOpen,
    ],
  );

  const previewValue = React.useMemo(
    () => ({
      previewSource,
      setPreviewSource,
      previewArtifactId,
      setPreviewArtifactId,
    }),
    [previewSource, previewArtifactId, setPreviewSource, setPreviewArtifactId],
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
