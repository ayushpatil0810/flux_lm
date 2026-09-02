"use client";

import * as React from "react";
import Link from "next/link";

import { ApiClientError, getErrorMessage } from "@/lib/api";
import { useWorkspaceContext } from "@/components/shell/workspace-context";
import { ErrorState } from "@/components/shell/states";
import { WorkspaceViewSkeleton } from "@/components/workspace/workspace-view-skeleton";
import { Button } from "@/components/ui/button";

interface WorkspaceShellProps {
  children: React.ReactNode;
}

/**
 * Gate for workspace-scoped routes. Loads the workspace through the
 * real API and renders the shell once known, an explicit not-found or
 * error state otherwise. Children only render with a valid workspace.
 */
export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const { data: workspace, isPending, error, refetch } = useWorkspaceContext();

  if (isPending) {
    return <WorkspaceViewSkeleton />;
  }

  if (error || !workspace) {
    const notFound = error instanceof ApiClientError && error.isNotFound;

    return (
      <div className="px-6 py-10 md:px-10">
        {notFound ? (
          <div className="max-w-md">
            <h1 className="text-title font-serif">Workspace not found</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              It may have been deleted, or the link is wrong.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/dashboard">Back to workspaces</Link>
            </Button>
          </div>
        ) : (
          <ErrorState
            title="Could not load this workspace"
            message={getErrorMessage(error)}
            onRetry={() => refetch()}
          />
        )}
      </div>
    );
  }

  return <>{children}</>;
}
