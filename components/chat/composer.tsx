"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  CpuIcon,
  Link01Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";

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
  const wasStreamingRef = React.useRef(false);

  // Auto-focus textarea when streaming ends so the user can immediately type a follow-up.
  React.useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      textareaRef.current?.focus();
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  };

  function submit() {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue("");
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
    }
  }

  return (
    <div className="shrink-0 px-4 pt-2 pb-6 md:px-8">
      <form
        className="mx-auto w-full max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="border-border/50 bg-card focus-within:border-primary/50 focus-within:ring-primary/10 relative flex flex-col rounded-2xl border shadow-sm transition-all focus-within:ring-4">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleInput}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything about this workspace..."
            aria-label="Message input"
            // We intentionally do NOT disable the textarea while streaming so users can queue up thoughts.
            className="text-foreground placeholder:text-muted-foreground/50 max-h-[300px] min-h-[60px] w-full resize-none bg-transparent px-4 py-4 text-base leading-relaxed focus:outline-none"
          />

          <div className="flex items-center justify-between gap-2 px-3 pt-1 pb-3">
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose model"
                    className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <HugeiconsIcon
                      icon={CpuIcon}
                      strokeWidth={1.5}
                      className="size-4"
                      aria-hidden
                    />
                    <span>{MODEL_LABELS[model]}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      strokeWidth={1.5}
                      className="size-3.5 opacity-60"
                      aria-hidden
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 rounded-xl">
                  <DropdownMenuRadioGroup
                    value={model}
                    onValueChange={(next) => onModelChange(next as ChatModel)}
                  >
                    {CHAT_MODELS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option}
                        value={option}
                        className="cursor-pointer rounded-lg py-2 text-sm"
                      >
                        {MODEL_LABELS[option]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                type="button"
                aria-pressed={webSearch}
                onClick={() => onWebSearchChange(!webSearch)}
                className={cn(
                  "focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  webSearch
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <HugeiconsIcon
                  icon={Link01Icon}
                  strokeWidth={1.5}
                  className="size-4"
                  aria-hidden
                />
                <span className="hidden sm:inline">Web Search</span>
              </button>
            </div>

            <div className="flex items-center">
              {isStreaming ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={onStop}
                  aria-label="Stop generating"
                  className="size-9 rounded-xl shadow-none"
                >
                  <HugeiconsIcon
                    icon={Layers01Icon}
                    strokeWidth={1.5}
                    className="size-4 fill-current"
                    aria-hidden
                  />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={value.trim().length === 0}
                  aria-label="Send message"
                  className={cn(
                    "size-9 rounded-xl shadow-none transition-all duration-200",
                    value.trim().length > 0
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md"
                      : "bg-muted text-muted-foreground/40",
                  )}
                >
                  <HugeiconsIcon
                    icon={ArrowUp01Icon}
                    strokeWidth={2}
                    className="size-4"
                    aria-hidden
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
