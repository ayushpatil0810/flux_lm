"use client";

// Adapted from Rare UI's Code Block (https://rareui.com).
// Copyright (c) 2026 Swami Malode. See rareui.LICENSE.

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { useToast } from "./toast";

const accent = "color-mix(in srgb, var(--primary) 65%, var(--heading))";
const codeTheme: PrismTheme = {
  plain: { color: "var(--foreground)", backgroundColor: "transparent" },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "var(--muted-foreground)", fontStyle: "italic" },
    },
    {
      types: ["keyword", "tag", "selector", "boolean", "number"],
      style: { color: accent },
    },
    {
      types: ["string", "char", "attr-value", "inserted"],
      style: {
        color: "color-mix(in srgb, var(--success) 60%, var(--heading))",
      },
    },
    {
      types: ["function", "class-name", "property", "builtin"],
      style: { color: "var(--heading)", fontWeight: "600" },
    },
  ],
};

export function CodeBlock({
  code,
  language = "text",
}: {
  code: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reducedMotion = useReducedMotion();
  const { push } = useToast();

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      push({ title: "Couldn’t copy code", variant: "destructive" });
    }
  }

  return (
    <div
      data-slot="code-block"
      className="border-border bg-muted/45 my-3 min-w-0 overflow-hidden rounded-lg border"
    >
      <div className="border-border/70 bg-muted/55 flex min-h-9 items-center justify-between gap-2 border-b px-3">
        <span className="text-muted-foreground truncate font-mono text-xs">
          {language}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 gap-1.5 rounded-md px-2 text-xs"
          aria-label={copied ? "Code copied" : "Copy code"}
          onClick={copy}
        >
          <span aria-hidden="true" className="grid size-3.5 place-items-center">
            <AnimatePresence initial={false}>
              <motion.span
                key={copied ? "copied" : "copy"}
                className="col-start-1 row-start-1 grid"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0, scale: 0.75 }}
                transition={{ duration: reducedMotion ? 0 : 0.16 }}
              >
                <HugeiconsIcon
                  icon={copied ? Tick02Icon : Copy01Icon}
                  className="size-3.5"
                />
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="min-w-10 text-left">
            {copied ? "Copied" : "Copy"}
          </span>
        </Button>
        <span className="sr-only" role="status">
          {copied ? "Code copied" : ""}
        </span>
      </div>
      <pre
        data-slot="code-block-pre"
        aria-label={`${language} code`}
        tabIndex={0}
        className="focus-visible:ring-ring m-0 max-h-96 overflow-auto px-3 py-2.5 font-mono text-xs leading-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      >
        <Highlight
          code={code}
          language={language.toLowerCase()}
          theme={codeTheme}
        >
          {({ tokens, getTokenProps }) => (
            <code className="block min-w-max">
              {tokens.map((line, index) => (
                <span key={index} className="block">
                  {line.map((token, tokenIndex) => (
                    <span key={tokenIndex} {...getTokenProps({ token })} />
                  ))}
                </span>
              ))}
            </code>
          )}
        </Highlight>
      </pre>
    </div>
  );
}
