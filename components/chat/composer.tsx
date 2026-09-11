"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  CpuIcon,
  Link01Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";

import type { ChatModel } from "@/lib/api";
import { CHAT_MODELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MODEL_LABELS: Record<ChatModel, string> = {
  "gpt-5.4-mini": "GPT-5.4 mini",
  "gpt-5.4-nano": "GPT-5.4 nano",
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

  // Focus composer with '/' or 'Cmd+K' / 'Ctrl+K' when not already typing in an input
  React.useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInputFocused =
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (
        (e.key === "/" && !isInputFocused) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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
    <div className="bg-card border-t border-border/40 p-2 sm:p-3 pb-2 md:pb-3">
      <form
        className="mx-auto w-full max-w-3xl"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="border-border/60 bg-muted/20 hover:border-border/80 focus-within:border-primary/40 focus-within:bg-card focus-within:ring-primary/10 relative flex flex-col rounded-xl border shadow-2xs transition-all focus-within:ring-2">
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
            className="text-foreground placeholder:text-muted-foreground/45 max-h-[140px] sm:max-h-[220px] min-h-[38px] sm:min-h-[38px] w-full resize-none bg-transparent px-3 pt-2.5 pb-1 sm:px-3.5 sm:pt-2 sm:pb-1 text-sm leading-snug focus:outline-none"
          />

          <div className="flex items-center justify-between gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose model"
                    className="text-muted-foreground hover:bg-muted/80 hover:text-foreground focus-visible:ring-ring flex h-8 sm:h-7.5 items-center gap-1 rounded-lg px-2 text-xs sm:text-[11px] font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none touch-manipulation"
                  >
                    <HugeiconsIcon
                      icon={CpuIcon}
                      strokeWidth={1.5}
                      className="size-3.5 shrink-0 text-violet-600 dark:text-violet-400"
                      aria-hidden
                    />
                    <span className="truncate max-w-[85px] xs:max-w-none">{MODEL_LABELS[model]}</span>
                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      strokeWidth={1.5}
                      className="size-3 shrink-0 opacity-60"
                      aria-hidden
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 rounded-xl">
                  <DropdownMenuRadioGroup
                    value={model}
                    onValueChange={(next) => onModelChange(next as ChatModel)}
                  >
                    {CHAT_MODELS.map((option) => (
                      <DropdownMenuRadioItem
                        key={option}
                        value={option}
                        className="cursor-pointer rounded-lg py-1.5 text-xs"
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
                  "focus-visible:ring-ring flex h-8 sm:h-7.5 items-center gap-1 rounded-lg px-2 text-xs sm:text-[11px] font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none touch-manipulation",
                  webSearch
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <HugeiconsIcon
                  icon={Link01Icon}
                  strokeWidth={1.5}
                  className="size-3.5 shrink-0"
                  aria-hidden
                />
                <span className="hidden sm:inline">Web Search</span>
              </button>
            </div>

            <div className="flex items-center">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Stop generating"
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-black/15 bg-white text-black shadow-xs transition-colors hover:bg-neutral-100 touch-manipulation dark:border-white/20"
                >
                  <span
                    className="size-2.5 rounded-[2px] bg-black"
                    aria-hidden="true"
                  />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={value.trim().length === 0}
                  aria-label="Send message"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-150 touch-manipulation",
                    value.trim().length > 0
                      ? "border border-[#2868F5] bg-gradient-to-b from-[#2875FF] to-[#3378F4] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] hover:from-[#347FFF] hover:to-[#4382F5] cursor-pointer"
                      : "border border-border/40 bg-muted/60 text-muted-foreground/35 cursor-not-allowed",
                  )}
                >
                  <HugeiconsIcon
                    icon={ArrowUp01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                    aria-hidden
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
