"use client";
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUp01Icon, ArrowDown01Icon, CpuIcon, Link01Icon, Layers01Icon } from '@hugeicons/core-free-icons';

import * as React from "react";
;

import type { ChatModel } from "@/lib/api";
import { CHAT_MODELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODEL_LABELS: Record<ChatModel, string> = {
  "gpt-4o-mini": "GPT-4o mini",
  "gpt-4o": "GPT-4o",
};

interface ComposerProps {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  model: ChatModel;
  onModelChange: (model: ChatModel) => void;
  webSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  autoFocus?: boolean;
}

/**
 * Chat composer: one bordered container with an auto-growing textarea,
 * a quiet model picker, and a web-search toggle.
 */
export function Composer({
  isStreaming,
  onSend,
  onStop,
  model,
  onModelChange,
  webSearch,
  onWebSearchChange,
  autoFocus,
}: ComposerProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function submit() {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue("");
    const el = textareaRef.current;
    if (el) el.style.height = "auto";
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 md:px-8">
      <form
        className="mx-auto w-full max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="rounded-2xl border border-border/60 bg-background transition-colors focus-within:border-primary/60">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              resize();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything about this workspace's sources…"
            aria-label="Message input"
            disabled={isStreaming}
            className="max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
          />

      {/* Action bar */}
          <div className="flex items-center justify-between gap-2 border-t border-border/40 px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              {/* Model Picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose model"
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <HugeiconsIcon icon={CpuIcon} strokeWidth={1.5} className="size-3.5" aria-hidden />
                    <span>{MODEL_LABELS[model]}</span>
                    <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={1.5} className="size-3 text-muted-foreground/70" aria-hidden />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuRadioGroup
                    value={model}
                    onValueChange={(next) => onModelChange(next as ChatModel)}
                  >
                    {CHAT_MODELS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option}
                        value={option}
                        className="text-xs"
                      >
                        {MODEL_LABELS[option]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Web Search Toggle */}
              <button
                type="button"
                aria-pressed={webSearch}
                onClick={() => onWebSearchChange(!webSearch)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  webSearch
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <HugeiconsIcon icon={Link01Icon} strokeWidth={1.5} className="size-3.5" aria-hidden />
                <span>Web search</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isStreaming ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={onStop}
                  aria-label="Stop generating"
                  className="size-8 rounded-full"
                >
                  <HugeiconsIcon icon={Layers01Icon} strokeWidth={1.5} className="size-3 fill-current" aria-hidden />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={value.trim().length === 0}
                  aria-label="Send message"
                  className={cn(
                    "size-8 rounded-full transition-colors",
                    value.trim().length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground/50"
                  )}
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={1.5} className="size-4" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
