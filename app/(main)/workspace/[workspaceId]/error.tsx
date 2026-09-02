"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Workspace rendering error:", error);
  }, [error]);

  return (
    <div className="flex h-svh w-full flex-col items-center justify-center gap-4 bg-background">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-xl font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || "An unexpected error occurred in the workspace."}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={() => window.location.href = "/dashboard"} variant="outline">
          Back to Dashboard
        </Button>
        <Button onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
