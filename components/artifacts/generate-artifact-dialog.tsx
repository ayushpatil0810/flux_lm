"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { getErrorMessage, type ArtifactType } from "@/lib/api";
import { useCreateArtifact } from "@/hooks/use-artifacts";
import { useSources } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import {
  ARTIFACT_TYPE_DESCRIPTIONS,
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_TYPE_ORDER,
} from "./artifact-meta";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GenerateArtifactDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Queues artifact generation. The backend rejects generation without
 * ready sources, so the dialog checks first and says so up front.
 * Sources default to everything Ready and can be narrowed per run.
 */
export function GenerateArtifactDialog({
  workspaceId,
  open,
  onOpenChange,
}: GenerateArtifactDialogProps) {
  const { push } = useToast();
  const createArtifact = useCreateArtifact(workspaceId);
  const { data: sources, isPending: sourcesPending } =
    useSources(workspaceId);

  const readySources = React.useMemo(
    () => (sources ?? []).filter((source) => source.status === "READY"),
    [sources],
  );

  const [type, setType] = React.useState<ArtifactType>("SUMMARY");
  const [title, setTitle] = React.useState("");
  /** Sources the user excluded; everything Ready is included by default. */
  const [excludedIds, setExcludedIds] = React.useState<ReadonlySet<string>>(
    new Set(),
  );

  const selectedSources = readySources.filter(
    (source) => !excludedIds.has(source.id),
  );

  function toggleSource(id: string, checked: boolean) {
    setExcludedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setType("SUMMARY");
      setTitle("");
      setExcludedIds(new Set());
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createArtifact.mutateAsync({
        type,
        title: title.trim() || undefined,
        sourceIds: selectedSources.map((source) => source.id),
      });
      push({
        title: `${ARTIFACT_TYPE_LABELS[type]} queued`,
        description: "It will show as Ready when generation finishes.",
      });
      onOpenChange(false);
    } catch (error) {
      push({
        variant: "destructive",
        title: "Could not start generation",
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-heading">
            Generate an artifact
          </DialogTitle>
          <DialogDescription>
            Study material built from this workspace&apos;s indexed sources.
          </DialogDescription>
        </DialogHeader>

        {sourcesPending ? (
          <p
            role="status"
            className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Checking sources…
          </p>
        ) : readySources.length === 0 ? (
          <div className="rounded-md border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium">No ready sources</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              Artifacts are generated from indexed sources. Add a source and
              wait for it to show as Ready first.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link
                href={`/workspace/${workspaceId}/sources`}
                onClick={() => onOpenChange(false)}
              >
                Go to sources
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5">

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Type</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {ARTIFACT_TYPE_ORDER.map((option) => (
                  <label
                    key={option}
                    className="cursor-pointer rounded-xl border border-border/60 px-3 py-2.5 transition-colors hover:bg-accent/40 has-checked:border-primary/60 has-checked:bg-primary/10"
                  >
                    <input
                      type="radio"
                      name="artifact-type"
                      value={option}
                      checked={type === option}
                      onChange={() => setType(option)}
                      className="sr-only"
                    />
                    <span className="block text-sm font-medium">
                      {ARTIFACT_TYPE_LABELS[option]}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {ARTIFACT_TYPE_DESCRIPTIONS[option]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Sources</legend>
              <div className="max-h-44 overflow-y-auto rounded-md border p-1.5">
                {readySources.map((source) => (
                  <label
                    key={source.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                  >
                    <Checkbox
                      checked={!excludedIds.has(source.id)}
                      onCheckedChange={(checked) =>
                        toggleSource(source.id, checked === true)
                      }
                      aria-label={`Include ${source.title}`}
                    />
                    <span className="truncate">{source.title}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSources.length} of {readySources.length} selected
              </p>
            </fieldset>

            <div className="grid gap-1.5">
              <Label htmlFor="artifact-title">
                Title{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="artifact-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={200}
                placeholder="Leave blank for an automatic title"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createArtifact.isPending || selectedSources.length === 0
                }
              >
                {createArtifact.isPending ? "Starting…" : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
