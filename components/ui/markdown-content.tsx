"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

const sharedComponents: Components = {
  table: ({ node: _node, ...props }) => (
    <div
      role="region"
      aria-label="Markdown table"
      tabIndex={0}
      className="focus-visible:ring-ring max-w-full overflow-x-auto rounded-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <table {...props} />
    </div>
  ),
};

const codeBlock: Components["pre"] = ({ node, ...props }) => {
  const code = node?.children[0];
  if (code?.type !== "element" || code.tagName !== "code") {
    return <pre {...props} />;
  }

  const classes = code.properties.className;
  const language = Array.isArray(classes)
    ? classes.find(
        (value) => typeof value === "string" && value.startsWith("language-"),
      )
    : undefined;
  const content = code.children
    .map((child) => (child.type === "text" ? child.value : ""))
    .join("")
    .replace(/\n$/, "");

  return (
    <CodeBlock
      code={content}
      language={
        typeof language === "string"
          ? language.slice("language-".length)
          : undefined
      }
    />
  );
};

const completedComponents: Components = { ...sharedComponents, pre: codeBlock };
const externalLink: Components["a"] = ({ node: _node, ...props }) => (
  <a {...props} target="_blank" rel="noopener noreferrer" />
);
const artifactComponents: Components = {
  ...completedComponents,
  a: externalLink,
};

export function MarkdownContent({
  content,
  className,
  streaming = false,
  externalLinks = false,
}: {
  content: string;
  className?: string;
  streaming?: boolean;
  externalLinks?: boolean;
}) {
  const components = externalLinks
    ? artifactComponents
    : streaming
      ? sharedComponents
      : completedComponents;

  return (
    <div className={cn("prose max-w-none min-w-0 wrap-break-word", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
