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
  workspaceId,
  children,
}: WorkspacePanelProviderProps) {
  const [activePanel, setActivePanel] = React.useState<ActivePanel>(null);
  const [previewSource, setPreviewSource] = React.useState<Source | null>(null);

  // Reset when moving to a different workspace.
  const prevWorkspaceId = React.useRef(workspaceId);
  if (workspaceId !== prevWorkspaceId.current) {
    prevWorkspaceId.current = workspaceId;
    // Perform the reset inline (during render) so it's synchronous.
    // This is the React-approved pattern for derived state resets.
    // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional inline reset
    setActivePanel(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional inline reset
    setPreviewSource(null);
  }

  const toggle = React.useCallback(
    (panel: Exclude<ActivePanel, null>) => {
      setActivePanel((current) => (current === panel ? null : panel));
    },
    [],
  );

  return (
    <WorkspacePanelContext.Provider 
      value={{ 
        activePanel, 
        setActivePanel, 
        toggle,
        previewSource,
        setPreviewSource
      }}
    >
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
