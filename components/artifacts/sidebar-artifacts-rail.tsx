"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  SidebarRightIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import * as React from "react";

import type { ArtifactType } from "@/lib/api";
import { useArtifacts } from "@/hooks/use-artifacts";
import {
  ARTIFACT_TYPE_ORDER,
  ARTIFACT_TYPE_LABELS,
  ARTIFACT_TYPE_DESCRIPTIONS,
} from "./artifact-meta";
import { ARTIFACT_TYPE_ICONS } from "./sidebar-artifacts";
import { ArtifactConfigDialog } from "./artifact-config-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarArtifactsRailProps {
  workspaceId: string;
  onExpand: () => void;
  onPreviewArtifact: (id: string) => void;
}

/**
 * Thinner collapsed rail for the Studio & Artifacts sidebar.
 * Displays quick-create generator icons with a plus badge at the bottom-right corner,
 * allowing instant generation without opening the full panel.
 */
export function SidebarArtifactsRail({
  workspaceId,
  onExpand,
  onPreviewArtifact,
}: SidebarArtifactsRailProps) {
  const { data: artifacts } = useArtifacts(workspaceId);
  const [activeType, setActiveType] = React.useState<ArtifactType | null>(null);

  const artifactCount = artifacts?.length ?? 0;

  return (
    <>
      <aside
        className="flex w-13 shrink-0 flex-col items-center rounded-xl border border-border/70 bg-card py-2.5 shadow-xs select-none"
        aria-label="Artifacts Quick Actions Rail"
      >
        {/* Top: Expand Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onExpand}
              aria-label="Expand Artifacts (⌘J)"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon
                icon={SidebarRightIcon}
                strokeWidth={1.5}
                className="size-5"
                aria-hidden
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" sideOffset={8}>
            Expand Artifacts (<kbd className="font-mono text-[10px]">⌘J</kbd>)
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="my-2 h-px w-6 shrink-0 bg-border/50" />

        {/* Generator Icons with Plus Badges */}
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto py-0.5">
          {ARTIFACT_TYPE_ORDER.map((type) => {
            const Icon = ARTIFACT_TYPE_ICONS[type];
            return (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setActiveType(type)}
                    aria-label={`Create ${ARTIFACT_TYPE_LABELS[type]}`}
                    className="relative flex size-9.5 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    <Icon className="size-5" />

                    {/* Plus badge safely anchored at bottom-right inside button bounds */}
                    <span className="absolute bottom-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs ring-1.5 ring-card">
                      <HugeiconsIcon
                        icon={Add01Icon}
                        strokeWidth={3}
                        className="size-2.5"
                        aria-hidden
                      />
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" sideOffset={8}>
                  Create {ARTIFACT_TYPE_LABELS[type]}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Bottom: Artifact Count & Quick Browse */}
        {artifactCount > 0 && (
          <div className="mt-auto flex shrink-0 flex-col items-center pt-2">
            <div className="mb-2 h-px w-6 shrink-0 bg-border/50" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onExpand}
                  aria-label={`Browse ${artifactCount} generated artifacts`}
                  className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <HugeiconsIcon
                    icon={File01Icon}
                    strokeWidth={1.5}
                    className="size-5"
                  />
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/20 px-1 font-mono text-[10px] font-bold text-primary ring-1.5 ring-card">
                    {artifactCount}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>
                Browse {artifactCount} artifact
                {artifactCount === 1 ? "" : "s"} (
                <kbd className="font-mono text-[10px]">⌘J</kbd>)
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>

      {/* Artifact Creation Dialog */}
      <ArtifactConfigDialog
        workspaceId={workspaceId}
        type={activeType}
        onOpenChange={(open) => {
          if (!open) setActiveType(null);
        }}
        onCreated={(id) => onPreviewArtifact(id)}
      />
    </>
  );
}
