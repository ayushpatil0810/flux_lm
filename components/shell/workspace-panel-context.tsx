"use client";

import * as React from "react";
import type { Source } from "@/lib/api";

interface WorkspacePanelContextType {
  leftOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  rightOpen: boolean;
  setRightOpen: (open: boolean) => void;
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
 */
export function WorkspacePanelProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);
  const [previewSource, setPreviewSourceInternal] = React.useState<Source | null>(null);
  const [previewArtifactId, setPreviewArtifactIdInternal] = React.useState<string | null>(null);

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
    }),
    [leftOpen, rightOpen],
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
