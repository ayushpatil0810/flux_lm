"use client";

import * as React from "react";
import type { Source } from "@/lib/api";

export type ActivePanel = "sources" | "artifacts" | null;

interface WorkspacePanelContextType {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;
  /** Toggles the given panel open/closed. */
  toggle: (panel: Exclude<ActivePanel, null>) => void;

  /** The source currently being previewed alongside the chat */
  previewSource: Source | null;
  setPreviewSource: (source: Source | null) => void;
}

const WorkspacePanelContext =
  React.createContext<WorkspacePanelContextType | null>(null);

interface WorkspacePanelProviderProps {
  workspaceId: string | undefined;
  children: React.ReactNode;
}

/**
 * Provides the active left-panel state (sources | artifacts | null) to both
 * the app sidebar and the workspace view so they can stay in sync without
 * prop drilling through the layout.
 *
 * Resets to null when the workspaceId changes so navigating between
 * workspaces always starts with a clean, closed panel.
 */
export function WorkspacePanelProvider({
  children,
}: { children: React.ReactNode }) {
  const [activePanel, setActivePanel] = React.useState<ActivePanel>(null);
  const [previewSource, setPreviewSource] = React.useState<Source | null>(null);

  const toggle = React.useCallback(
    (panel: Exclude<ActivePanel, null>) => {
      setActivePanel((current) => (current === panel ? null : panel));
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      activePanel,
      setActivePanel,
      toggle,
      previewSource,
      setPreviewSource,
    }),
    [activePanel, previewSource, toggle]
  );

  return (
    <WorkspacePanelContext.Provider value={value}>
      {children}
    </WorkspacePanelContext.Provider>
  );
}

export function useWorkspacePanel(): WorkspacePanelContextType {
  const context = React.useContext(WorkspacePanelContext);
  if (!context) {
    throw new Error("useWorkspacePanel must be used within WorkspacePanelProvider");
  }
  return context;
}
