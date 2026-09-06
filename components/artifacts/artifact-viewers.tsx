"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ListSettingIcon,
  ListIcon,
  ArrowLeft02Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import * as React from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { LearningArtifact, LearningArtifactContent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MindmapFlow = dynamic(
  () => import("./mindmap-flow").then((mod) => mod.MindmapFlow),
  {
    ssr: false,
    loading: () => (
      <div className="border-border/80 bg-card/40 flex h-[580px] w-full items-center justify-center rounded-xl border shadow-xs">
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    ),
  },
);

/**
 * Reusable Markdown renderer with GFM plugin and secure external link handling.
 */
function MarkdownRenderer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none break-words",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Per-type renderers for generated artifact content. Resiliently handles
 * objects, JSON strings, or raw markdown strings.
 */
export function ArtifactViewer({
  artifact,
  isExpanded,
}: {
  artifact: LearningArtifact;
  isExpanded?: boolean;
}) {
  const content = React.useMemo(() => {
    const raw = artifact.content;
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        return { markdown: raw, text: raw };
      }
    }
    return raw as LearningArtifactContent;
  }, [artifact.content]);

  switch (artifact.type) {
    case "SUMMARY":
      return (
        <ProseViewer
          text={firstString(
            content.markdown,
            content.summary,
            content.text,
            (content as Record<string, unknown>).content,
          )}
          emptyLabel="This summary has no content."
          isExpanded={isExpanded}
        />
      );
    case "REPORT":
      return <ReportViewer content={content} isExpanded={isExpanded} />;
    case "TAKEAWAYS":
      return <TakeawaysViewer content={content} isExpanded={isExpanded} />;
    case "FLASHCARDS":
      return <FlashcardsViewer content={content} isExpanded={isExpanded} />;
    case "QUIZ":
      return <QuizViewer content={content} artifactId={artifact.id} isExpanded={isExpanded} />;
    case "MINDMAP":
      return <MindmapViewer content={content} isExpanded={isExpanded} />;
    default:
      return <ViewerFallback label="This artifact cannot be displayed." />;
  }
}

function ViewerFallback({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-14 text-center">
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

/** Long-form markdown content viewer. */
function ProseViewer({
  text,
  emptyLabel,
  isExpanded,
}: {
  text: string | null;
  emptyLabel: string;
  isExpanded?: boolean;
}) {
  if (!text) return <ViewerFallback label={emptyLabel} />;
  return (
    <div
      className={cn(
        "mx-auto w-full px-1",
        isExpanded ? "max-w-4xl px-2 sm:px-6 py-2" : "max-w-3xl",
      )}
    >
      <MarkdownRenderer content={text} />
    </div>
  );
}

interface ReportSection {
  title: string;
  content: string;
}

function normalizeSections(content: LearningArtifactContent): ReportSection[] {
  const raw = (content as Record<string, unknown>).sections;
  if (!Array.isArray(raw)) return [];
  const sections: ReportSection[] = [];
  for (const entry of raw) {
    const record = asRecord(entry);
    if (
      record &&
      typeof record.title === "string" &&
      typeof record.content === "string"
    ) {
      sections.push({ title: record.title, content: record.content });
    }
  }
  return sections;
}

function ReportViewer({
  content,
  isExpanded,
}: {
  content: LearningArtifactContent;
  isExpanded?: boolean;
}) {
  const sections = normalizeSections(content);
  const fullMarkdown = firstString(
    content.markdown,
    content.text,
    (content as Record<string, unknown>).content,
  );

  if (sections.length === 0) {
    return (
      <ProseViewer
        text={fullMarkdown}
        emptyLabel="This report has no content."
        isExpanded={isExpanded}
      />
    );
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-8 px-1",
        isExpanded ? "max-w-4xl px-2 sm:px-6 py-2 gap-10" : "max-w-3xl",
      )}
    >
      {sections.map((section, index) => (
        <section key={index} className="space-y-3">
          <h2 className="text-foreground text-base md:text-lg font-semibold tracking-tight border-b border-border/40 pb-2">
            {section.title}
          </h2>
          <MarkdownRenderer content={section.content} />
        </section>
      ))}
    </div>
  );
}

/** Takeaways as an editorial numbered list with markdown support. */
function TakeawaysViewer({
  content,
  isExpanded,
}: {
  content: LearningArtifactContent;
  isExpanded?: boolean;
}) {
  const items = normalizeStringList(content.takeaways ?? content.items);
  if (items.length === 0) {
    return <ViewerFallback label="No takeaways were generated." />;
  }
  return (
    <ol
      className={cn(
        "mx-auto w-full space-y-4 px-1",
        isExpanded ? "max-w-3xl px-2 sm:px-6 py-2 space-y-5" : "max-w-2xl",
      )}
    >
      {items.map((item, index) => (
        <li key={index} className="flex gap-4 items-start">
          <span
            aria-hidden
            className="text-amber-600/80 dark:text-amber-400/80 mt-0.5 shrink-0 font-mono text-xs font-semibold"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 min-w-0">
            <MarkdownRenderer content={item} className="text-sm text-foreground/90" />
          </div>
        </li>
      ))}
    </ol>
  );
}

interface Flashcard {
  front: string;
  back: string;
}

function normalizeCards(content: LearningArtifactContent): Flashcard[] {
  const raw = Array.isArray(content.cards)
    ? content.cards
    : Array.isArray(content.flashcards)
      ? content.flashcards
      : [];
  const cards: Flashcard[] = [];
  for (const entry of raw) {
    const record = asRecord(entry);
    if (!record) continue;
    const front = firstString(record.front, record.question);
    const back = firstString(record.back, record.answer);
    if (front && back) cards.push({ front, back });
  }
  return cards;
}

/** Flashcards as a physical 3D flippable study deck with wrap-around navigation and keyboard controls. */
function FlashcardsViewer({
  content,
  isExpanded,
}: {
  content: LearningArtifactContent;
  isExpanded?: boolean;
}) {
  const cards = React.useMemo(() => normalizeCards(content), [content]);
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);

  if (cards.length === 0) {
    return <ViewerFallback label="No cards were generated." />;
  }

  const current = cards[Math.min(index, cards.length - 1)];

  function go(delta: number) {
    setFlipped(false);
    setIndex((value) => (value + delta + cards.length) % cards.length);
  }

  return (
    <div
      className={cn(
        "mx-auto w-full select-none",
        isExpanded ? "max-w-2xl md:max-w-3xl py-4" : "max-w-xl",
      )}
    >
      {/* 3D Perspective Flippable Card */}
      <div
        tabIndex={0}
        role="button"
        aria-pressed={flipped}
        aria-label={
          flipped
            ? "Card flipped to answer. Press Space or click to show prompt."
            : "Card showing prompt. Press Space or click to show answer."
        }
        onClick={() => setFlipped((value) => !value)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setFlipped((value) => !value);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            go(1);
          }
        }}
        className={cn(
          "group relative min-h-[260px] sm:min-h-[300px] w-full cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isExpanded && "min-h-[340px] sm:min-h-[400px]",
        )}
        style={{ perspective: 1200 }}
      >
        <div
          className="relative min-h-[260px] sm:min-h-[300px] w-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d]"
          style={{
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Face (Prompt) */}
          <div
            className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 sm:p-8 text-center shadow-xs transition-all duration-200 group-hover:border-border group-hover:shadow-md [backface-visibility:hidden]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-mono inline-flex items-center rounded-full bg-violet-500/10 dark:bg-violet-400/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Prompt
              </span>
              <span className="font-mono text-[11px] text-muted-foreground/60">
                {index + 1} / {cards.length}
              </span>
            </div>

            <div className="my-auto flex items-center justify-center px-2 py-4">
              <p className="font-heading text-base sm:text-lg md:text-xl font-medium leading-relaxed text-foreground">
                {current.front}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
              <span>Click to reveal answer</span>
              <kbd className="hidden sm:inline-block rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                Space
              </kbd>
            </div>
          </div>

          {/* Back Face (Answer) */}
          <div
            className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-2xl border border-primary/40 bg-card p-6 sm:p-8 text-center shadow-xs transition-all duration-200 group-hover:border-primary/60 group-hover:shadow-md [backface-visibility:hidden]"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="font-mono inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                Answer
              </span>
              <span className="font-mono text-[11px] text-muted-foreground/60">
                {index + 1} / {cards.length}
              </span>
            </div>

            <div className="my-auto flex items-center justify-center px-2 py-4">
              <p className="font-heading text-base sm:text-lg md:text-xl font-medium leading-relaxed text-foreground">
                {current.back}
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
              <span>Click to flip back</span>
              <kbd className="hidden sm:inline-block rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                Space
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls & Deck Progress */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => go(-1)}
          className="h-8 gap-1 rounded-lg text-xs"
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          <span>Previous</span>
        </Button>

        <div className="flex flex-col items-center gap-1.5">
          <span
            className="font-mono text-xs text-muted-foreground"
            aria-live="polite"
          >
            {index + 1} of {cards.length}
          </span>
          {/* Progress dots indicator */}
          <div className="flex items-center gap-1">
            {cards.slice(0, 12).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === index % Math.min(cards.length, 12)
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/25",
                )}
              />
            ))}
            {cards.length > 12 && (
              <span className="text-[9px] font-mono text-muted-foreground/50">
                +{cards.length - 12}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => go(1)}
          className="h-8 gap-1 rounded-lg text-xs"
        >
          <span>Next</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
        </Button>
      </div>
    </div>
  );
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

function normalizeQuestions(content: LearningArtifactContent): QuizQuestion[] {
  const raw = Array.isArray(content.questions)
    ? content.questions
    : Array.isArray(content.quiz)
      ? content.quiz
      : [];
  const questions: QuizQuestion[] = [];
  for (const entry of raw) {
    const record = asRecord(entry);
    if (!record || typeof record.question !== "string") continue;
    const options = Array.isArray(record.options)
      ? record.options.filter(
          (option): option is string => typeof option === "string",
        )
      : [];
    const correctIndex =
      typeof record.correctIndex === "number"
        ? record.correctIndex
        : typeof record.answerIndex === "number"
          ? record.answerIndex
          : null;
    if (
      options.length < 2 ||
      correctIndex === null ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      continue;
    }
    questions.push({
      question: record.question,
      options,
      correctIndex,
      explanation:
        typeof record.explanation === "string" ? record.explanation : undefined,
    });
  }
  return questions;
}

/**
 * Quiz with persistent answers via localStorage and immediate honest feedback:
 * picking an option reveals the correct answer and its explanation, and locks the question.
 */
function QuizViewer({
  content,
  artifactId,
  isExpanded,
}: {
  content: LearningArtifactContent;
  artifactId?: string;
  isExpanded?: boolean;
}) {
  const questions = React.useMemo(() => normalizeQuestions(content), [content]);
  const storageKey = artifactId ? `flux_quiz_answers_${artifactId}` : null;

  const [selections, setSelections] = React.useState<Record<number, number>>({});

  // Restore saved selections from localStorage
  React.useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setSelections(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setSelections({});
  }, [storageKey]);

  const handleSelect = React.useCallback(
    (questionIndex: number, optionIndex: number) => {
      setSelections((current) => {
        const next = { ...current, [questionIndex]: optionIndex };
        if (storageKey && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    [storageKey],
  );

  const handleStartOver = React.useCallback(() => {
    setSelections({});
    if (storageKey && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }, [storageKey]);

  if (questions.length === 0) {
    return <ViewerFallback label="No questions were generated." />;
  }

  const answeredCount = Object.keys(selections).length;
  const correctCount = questions.reduce(
    (count, question, index) =>
      selections[index] === question.correctIndex ? count + 1 : count,
    0,
  );

  return (
    <div
      className={cn(
        "mx-auto w-full",
        isExpanded ? "max-w-3xl md:max-w-4xl py-2" : "max-w-2xl",
      )}
    >
      <div className="mb-6 flex items-center justify-between gap-4 border-b pb-3">
        <p className="text-muted-foreground text-sm">
          {answeredCount} of {questions.length} answered
          {answeredCount === questions.length
            ? ` · ${correctCount} correct`
            : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStartOver}
          disabled={answeredCount === 0}
        >
          Start over
        </Button>
      </div>
      <ol className="space-y-8">
        {questions.map((question, questionIndex) => {
          const selection = selections[questionIndex];
          const answered = selection !== undefined;
          return (
            <li key={questionIndex}>
              <p className="text-sm leading-relaxed font-medium">
                <span className="text-muted-foreground mr-2 font-mono text-xs">
                  {questionIndex + 1}.
                </span>
                {question.question}
              </p>
              <div
                className="mt-3 grid gap-2"
                role="group"
                aria-label={`Options for question ${questionIndex + 1}`}
              >
                {question.options.map((option, optionIndex) => {
                  const isCorrect = optionIndex === question.correctIndex;
                  const isChosen = selection === optionIndex;
                  return (
                    <button
                      key={optionIndex}
                      type="button"
                      disabled={answered}
                      onClick={() => handleSelect(questionIndex, optionIndex)}
                      className={cn(
                        "focus-visible:ring-ring/60 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                        !answered && "hover:bg-accent",
                        answered &&
                          isCorrect &&
                          "border-success/60 bg-success/10",
                        answered &&
                          isChosen &&
                          !isCorrect &&
                          "border-destructive/60 bg-destructive/10",
                        answered && !isCorrect && !isChosen && "opacity-60",
                      )}
                    >
                      {option}
                      {answered && isCorrect ? (
                        <span className="text-success ml-2 text-xs font-medium">
                          Correct
                        </span>
                      ) : null}
                      {answered && isChosen && !isCorrect ? (
                        <span className="text-destructive ml-2 text-xs font-medium">
                          Your answer
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {answered && question.explanation ? (
                <p className="text-muted-foreground mt-2.5 border-l-2 pl-3 text-xs leading-relaxed">
                  {question.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

interface MindmapNode {
  id: string;
  label: string;
}

interface MindmapEdge {
  source: string;
  target: string;
}

interface MindmapTreeNode extends MindmapNode {
  children: MindmapTreeNode[];
}

function normalizeMindmap(content: LearningArtifactContent): {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
} {
  const rawNodes = Array.isArray(content.nodes) ? content.nodes : [];
  const rawEdges = Array.isArray(content.edges) ? content.edges : [];
  const nodes: MindmapNode[] = [];
  const edges: MindmapEdge[] = [];
  for (const entry of rawNodes) {
    const record = asRecord(entry);
    if (
      record &&
      typeof record.id === "string" &&
      typeof record.label === "string"
    ) {
      nodes.push({ id: record.id, label: record.label });
    }
  }
  for (const entry of rawEdges) {
    const record = asRecord(entry);
    if (
      record &&
      typeof record.source === "string" &&
      typeof record.target === "string"
    ) {
      edges.push({ source: record.source, target: record.target });
    }
  }
  return { nodes, edges };
}

/** Derives a tree from the edge list; each node gets at most one parent. */
function buildTree(
  nodes: MindmapNode[],
  edges: MindmapEdge[],
): MindmapTreeNode[] {
  const byId = new Map<string, MindmapTreeNode>(
    nodes.map((node) => [node.id, { ...node, children: [] }]),
  );
  const hasParent = new Set<string>();
  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    const parent = byId.get(edge.source);
    const child = byId.get(edge.target);
    if (parent && child && !hasParent.has(edge.target)) {
      parent.children.push(child);
      hasParent.add(edge.target);
    }
  }
  const roots: MindmapTreeNode[] = [];
  for (const node of byId.values()) {
    if (!hasParent.has(node.id)) roots.push(node);
  }
  // A pure cycle would leave no roots; start from the first node instead.
  if (roots.length === 0 && byId.size > 0) {
    roots.push(byId.values().next().value as MindmapTreeNode);
  }
  return roots;
}

function MindmapBranch({
  node,
  ancestry,
  isRoot,
}: {
  node: MindmapTreeNode;
  ancestry: ReadonlySet<string>;
  isRoot?: boolean;
}) {
  const next = new Set(ancestry).add(node.id);
  const children = node.children.filter((child) => !next.has(child.id));
  return (
    <li>
      <span className={isRoot ? "font-heading text-base font-semibold" : "text-sm"}>
        {node.label}
      </span>
      {children.length > 0 ? (
        <ul className="mt-1.5 ml-3 space-y-1.5 border-l pl-4">
          {children.map((child) => (
            <MindmapBranch key={child.id} node={child} ancestry={next} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Mind map rendered as an interactive React Flow canvas with optional text outline view. */
function MindmapViewer({
  content,
  isExpanded,
}: {
  content: LearningArtifactContent;
  isExpanded?: boolean;
}) {
  const { nodes, edges } = React.useMemo(
    () => normalizeMindmap(content),
    [content],
  );
  const roots = React.useMemo(() => buildTree(nodes, edges), [nodes, edges]);
  const [viewMode, setViewMode] = React.useState<"flow" | "tree">("flow");

  if (nodes.length === 0 && roots.length === 0) {
    return <ViewerFallback label="This mind map has no content." />;
  }

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-4",
        isExpanded ? "max-w-none h-full" : "max-w-5xl",
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <p className="text-muted-foreground text-xs font-medium">
          {nodes.length} concepts · {edges.length} connections
        </p>
        <div className="border-border/60 bg-card flex items-center gap-1 rounded-lg border p-1 self-start sm:self-auto">
          <Button
            variant={viewMode === "flow" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("flow")}
            className="h-7 gap-1.5 px-2 sm:px-2.5 text-xs font-medium"
          >
            <HugeiconsIcon
              icon={ListSettingIcon}
              strokeWidth={1.5}
              className="size-3.5"
            />
            <span className="hidden xs:inline">Interactive </span>Diagram
          </Button>
          <Button
            variant={viewMode === "tree" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("tree")}
            className="h-7 gap-1.5 px-2 sm:px-2.5 text-xs font-medium"
          >
            <HugeiconsIcon
              icon={ListIcon}
              strokeWidth={1.5}
              className="size-3.5"
            />
            <span className="hidden xs:inline">Outline </span>View
          </Button>
        </div>
      </div>

      {viewMode === "flow" ? (
        <MindmapFlow
          nodes={nodes}
          edges={edges}
          className={
            isExpanded
              ? "h-[calc(100vh-230px)] min-h-[580px] md:min-h-[650px]"
              : undefined
          }
        />
      ) : (
        <div className="bg-card rounded-xl border p-6 shadow-xs">
          <ul className="space-y-2">
            {roots.map((node) => (
              <MindmapBranch
                key={node.id}
                node={node}
                ancestry={new Set()}
                isRoot
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
