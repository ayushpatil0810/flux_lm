"use client";

import * as React from "react";
import { useWorkspace } from "@/hooks/use-workspaces";

type UseWorkspaceReturn = ReturnType<typeof useWorkspace>;

export const WorkspaceContext = React.createContext<UseWorkspaceReturn | null>(null);

export function useWorkspaceContext() {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceContext must be used within a WorkspaceContext.Provider");
  }
  return context;
}
