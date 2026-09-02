"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading02Icon } from "@hugeicons/core-free-icons";

import * as React from "react";

import type { ArtifactType } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";
import { useCreateArtifact } from "@/hooks/use-artifacts";
import { useSources } from "@/hooks/use-sources";
import { useToast } from "@/components/providers/toast-provider";
import { ARTIFACT_TYPE_LABELS } from "./artifact-meta";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ── Per-type config schemas ─────────────────────────────────────────────────

type LengthOption = "brief" | "standard" | "detailed";
type CountOption5_10_15 = 5 | 10 | 15;
type CountOption10_20_30 = 10 | 20 | 30;
type DifficultyOption = "easy" | "medium" | "hard";
type StyleOption = "academic" | "executive" | "casual";

interface SummaryConfig {
  length: LengthOption;
}
interface TakeawaysConfig {
  count: CountOption5_10_15;
}
interface FlashcardsConfig {
  count: CountOption10_20_30;
}
interface QuizConfig {
  count: CountOption5_10_15;
  difficulty: DifficultyOption;
}
interface MindmapConfig {}
interface ReportConfig {
  style: StyleOption;
}

type ArtifactConfig =
  | SummaryConfig
  | TakeawaysConfig
  | FlashcardsConfig
  | QuizConfig
  | MindmapConfig
  | ReportConfig;

// ── Helper: segmented pill button group ────────────────────────────────────

function SegmentGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  formatLabel,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  formatLabel?: (v: T) => string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {label}
      </p>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
              value === opt
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-border/70 hover:text-foreground",
            )}
          >
            {formatLabel ? formatLabel(opt) : String(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Per-type config panels ──────────────────────────────────────────────────

function SummaryOptions({
  config,
  onChange,
}: {
  config: SummaryConfig;
  onChange: (c: SummaryConfig) => void;
}) {
  return (
    <SegmentGroup
      label="Length"
      options={["brief", "standard", "detailed"] as const}
      value={config.length}
      onChange={(v) => onChange({ length: v })}
      formatLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
    />
  );
}

function TakeawaysOptions({
  config,
  onChange,
}: {
  config: TakeawaysConfig;
  onChange: (c: TakeawaysConfig) => void;
}) {
  return (
    <SegmentGroup
      label="Number of takeaways"
      options={[5, 10, 15] as const}
      value={config.count}
      onChange={(v) => onChange({ count: v })}
    />
  );
}

function FlashcardsOptions({
  config,
  onChange,
}: {
  config: FlashcardsConfig;
  onChange: (c: FlashcardsConfig) => void;
}) {
  return (
    <SegmentGroup
      label="Number of cards"
      options={[10, 20, 30] as const}
      value={config.count}
      onChange={(v) => onChange({ count: v })}
    />
  );
}

function QuizOptions({
  config,
  onChange,
}: {
  config: QuizConfig;
  onChange: (c: QuizConfig) => void;
}) {
  return (
    <div className="space-y-3">
      <SegmentGroup
        label="Number of questions"
        options={[5, 10, 15] as const}
        value={config.count}
        onChange={(v) => onChange({ ...config, count: v })}
      />
      <SegmentGroup
        label="Difficulty"
        options={["easy", "medium", "hard"] as const}
        value={config.difficulty}
        onChange={(v) => onChange({ ...config, difficulty: v })}
        formatLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
      />
    </div>
  );
}

function ReportOptions({
  config,
  onChange,
}: {
  config: ReportConfig;
  onChange: (c: ReportConfig) => void;
}) {
  return (
    <SegmentGroup
      label="Style"
      options={["academic", "executive", "casual"] as const}
      value={config.style}
      onChange={(v) => onChange({ style: v })}
      formatLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
    />
  );
}

function defaultConfig(type: ArtifactType): ArtifactConfig {
  switch (type) {
    case "SUMMARY":
      return { length: "standard" };
    case "TAKEAWAYS":
      return { count: 10 };
    case "FLASHCARDS":
      return { count: 20 };
    case "QUIZ":
      return { count: 10, difficulty: "medium" };
    case "MINDMAP":
      return {};
    case "REPORT":
      return { style: "academic" };
  }
}

// ── Main dialog ─────────────────────────────────────────────────────────────

interface ArtifactConfigDialogProps {
  workspaceId: string;
  /** The artifact type to generate. null means closed. */
  type: ArtifactType | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Per-type generation config dialog. Replaces GenerateArtifactDialog
 * with focused options per artifact type (question count, difficulty, etc.)
 */
export function ArtifactConfigDialog({
  workspaceId,
  type,
  onOpenChange,
}: ArtifactConfigDialogProps) {
  const { push } = useToast();
  const createArtifact = useCreateArtifact(workspaceId);
  const { data: sources } = useSources(workspaceId);

  const readySources = React.useMemo(
    () => (sources ?? []).filter((s) => s.status === "READY"),
    [sources],
  );

  const [config, setConfig] = React.useState<ArtifactConfig>(() =>
    defaultConfig(type ?? "SUMMARY"),
  );
  const [excludedIds, setExcludedIds] = React.useState<ReadonlySet<string>>(
    new Set(),
  );
  const [title, setTitle] = React.useState("");

  // Reset config when type changes
  React.useEffect(() => {
    if (type) {
      setConfig(defaultConfig(type));
      setExcludedIds(new Set());
      setTitle("");
    }
  }, [type]);

  const selectedSources = readySources.filter((s) => !excludedIds.has(s.id));

  function toggleSource(id: string, checked: boolean) {
    setExcludedIds((cur) => {
      const next = new Set(cur);
      if (checked) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!type) return;
    try {
      await createArtifact.mutateAsync({
        type,
        title: title.trim() || undefined,
        sourceIds: selectedSources.map((s) => s.id),
      });
      push({
        title: `${ARTIFACT_TYPE_LABELS[type]} queued`,
        description: "It will appear below when generation finishes.",
      });
      onOpenChange(false);
    } catch (err) {
      push({
        variant: "destructive",
        title: "Could not start generation",
        description: getErrorMessage(err),
      });
    }
  }

  const open = type !== null;

  function renderTypeOptions() {
    switch (type) {
      case "SUMMARY":
        return (
          <SummaryOptions
            config={config as SummaryConfig}
            onChange={setConfig}
          />
        );
      case "TAKEAWAYS":
        return (
          <TakeawaysOptions
            config={config as TakeawaysConfig}
            onChange={setConfig}
          />
        );
      case "FLASHCARDS":
        return (
          <FlashcardsOptions
            config={config as FlashcardsConfig}
            onChange={setConfig}
          />
        );
      case "QUIZ":
        return (
          <QuizOptions config={config as QuizConfig} onChange={setConfig} />
        );
      case "MINDMAP":
        return null;
      case "REPORT":
        return (
          <ReportOptions config={config as ReportConfig} onChange={setConfig} />
        );
      default:
        return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Header — pinned */}
        <DialogHeader className="border-border/30 shrink-0 border-b px-5 pt-5 pb-4">
          <DialogTitle className="text-heading font-serif">
            Generate {type ? ARTIFACT_TYPE_LABELS[type].toLowerCase() : ""}
          </DialogTitle>
          <DialogDescription>
            Built from your workspace's indexed sources.
          </DialogDescription>
        </DialogHeader>

        {/* Body — scrollable */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
          {readySources.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-6 text-center">
              <p className="text-sm font-medium">No ready sources</p>
              <p className="text-muted-foreground mx-auto mt-1.5 max-w-xs text-sm">
                Add a source and wait for it to finish indexing before
                generating.
              </p>
            </div>
          ) : (
            <form
              id="artifact-config-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {/* Type-specific options */}
              {renderTypeOptions()}

              {/* Sources */}
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Sources
                </p>
                <div className="border-border/40 max-h-40 overflow-y-auto rounded-lg border p-1.5">
                  {readySources.map((source) => (
                    <label
                      key={source.id}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
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
                <p className="text-muted-foreground text-xs">
                  {selectedSources.length} of {readySources.length} selected
                </p>
              </div>

              {/* Optional title */}
              <div className="grid gap-1.5">
                <Label htmlFor="artifact-config-title">
                  Title{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="artifact-config-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder="Leave blank for an automatic title"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer — pinned */}
        {readySources.length > 0 && (
          <div className="border-border/30 flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              form="artifact-config-form"
              disabled={
                createArtifact.isPending || selectedSources.length === 0
              }
            >
              {createArtifact.isPending ? (
                <>
                  <HugeiconsIcon
                    icon={Loading02Icon}
                    strokeWidth={1.5}
                    className="size-4 animate-spin"
                    aria-hidden
                  />
                  Starting…
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
