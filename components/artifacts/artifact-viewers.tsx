"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { FadersHorizontalIcon as LayoutGrid, ListIcon as List } from "@/components/ui/icons";

import type { LearningArtifact, LearningArtifactContent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MindmapFlow = dynamic(
  () => import("./mindmap-flow").then((mod) => mod.MindmapFlow),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[580px] w-full items-center justify-center rounded-xl border border-border/80 bg-card/40 shadow-xs">
        <div className="animate-spin h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
);

/**
 * Per-type renderers for generated artifact content. The generator's
 * output shapes are known (learning-artifact-generation.ts), but every
 * viewer still validates defensively and falls back to an honest message.
 */
export function ArtifactViewer({ artifact }: { artifact: LearningArtifact }) {
  const content = artifact.content ?? {};
  switch (artifact.type) {
    case "SUMMARY":
      return (
        <ProseViewer
          text={firstString(content.markdown, content.summary, content.text)}
          emptyLabel="This summary has no content."
        />
      );
    case "REPORT":
      return <ReportViewer content={content} />;
    case "TAKEAWAYS":
      return <TakeawaysViewer content={content} />;
    case "FLASHCARDS":
      return <FlashcardsViewer content={content} />;
    case "QUIZ":
      return <QuizViewer content={content} />;
    case "MINDMAP":
      return <MindmapViewer content={content} />;
    default:
      return <ViewerFallback label="This artifact cannot be displayed." />;
  }
}

function ViewerFallback({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed px-6 py-14 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
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

/** Long-form text in the reading serif. */
function ProseViewer({
  text,
  emptyLabel,
}: {
  text: string | null;
  emptyLabel: string;
}) {
  if (!text) return <ViewerFallback label={emptyLabel} />;
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="whitespace-pre-wrap font-serif text-base leading-relaxed">
        {text}
      </div>
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

function ReportViewer({ content }: { content: LearningArtifactContent }) {
  const sections = normalizeSections(content);
  if (sections.length === 0) {
    return (
      <ProseViewer
        text={firstString(content.markdown, content.text)}
        emptyLabel="This report has no content."
      />
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-9">
      {sections.map((section, index) => (
        <section key={index}>
          <h2 className="font-serif text-heading">{section.title}</h2>
          <div className="mt-2.5 whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground/90">
            {section.content}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Takeaways as a numbered editorial list: mono index, serif text. */
function TakeawaysViewer({ content }: { content: LearningArtifactContent }) {
  const items = normalizeStringList(content.takeaways ?? content.items);
  if (items.length === 0) {
    return <ViewerFallback label="No takeaways were generated." />;
  }
  return (
    <ol className="mx-auto w-full max-w-2xl space-y-4">
      {items.map((item, index) => (
        <li key={index} className="flex gap-4">
          <span
            aria-hidden
            className="mt-1 shrink-0 font-mono text-xs text-muted-foreground"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="font-serif text-base leading-relaxed">{item}</p>
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

/** Flashcards as a flippable study deck with wrap-around navigation. */
function FlashcardsViewer({ content }: { content: LearningArtifactContent }) {
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
    <div className="mx-auto w-full max-w-xl">
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        aria-pressed={flipped}
        aria-label={flipped ? "Show prompt" : "Show answer"}
        className="flex min-h-[240px] w-full flex-col items-center justify-center rounded-lg border bg-card px-8 py-10 text-center transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {flipped ? "Answer" : "Prompt"}
        </span>
        <span className="mt-4 font-serif text-heading leading-snug">
          {flipped ? current.back : current.front}
        </span>
        <span className="mt-6 text-xs text-muted-foreground">
          Select to flip
        </span>
      </button>
      <div className="mt-4 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => go(-1)}>
          Previous
        </Button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {Math.min(index, cards.length - 1) + 1} of {cards.length}
        </span>
        <Button variant="outline" size="sm" onClick={() => go(1)}>
          Next
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
 * Quiz with immediate, honest feedback: picking an option reveals the
 * correct answer and its explanation, and locks the question.
 */
function QuizViewer({ content }: { content: LearningArtifactContent }) {
  const questions = React.useMemo(() => normalizeQuestions(content), [content]);
  const [selections, setSelections] = React.useState<Record<number, number>>(
    {},
  );

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
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4 border-b pb-3">
        <p className="text-sm text-muted-foreground">
          {answeredCount} of {questions.length} answered
          {answeredCount === questions.length
            ? ` · ${correctCount} correct`
            : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelections({})}
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
              <p className="text-sm font-medium leading-relaxed">
                <span className="mr-2 font-mono text-xs text-muted-foreground">
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
                      onClick={() =>
                        setSelections((current) => ({
                          ...current,
                          [questionIndex]: optionIndex,
                        }))
                      }
                      className={cn(
                        "rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        !answered && "hover:bg-accent",
                        answered && isCorrect && "border-success/60 bg-success/10",
                        answered &&
                          isChosen &&
                          !isCorrect &&
                          "border-destructive/60 bg-destructive/10",
                        answered && !isCorrect && !isChosen && "opacity-60",
                      )}
                    >
                      {option}
                      {answered && isCorrect ? (
                        <span className="ml-2 text-xs font-medium text-success">
                          Correct
                        </span>
                      ) : null}
                      {answered && isChosen && !isCorrect ? (
                        <span className="ml-2 text-xs font-medium text-destructive">
                          Your answer
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {answered && question.explanation ? (
                <p className="mt-2.5 border-l-2 pl-3 text-xs leading-relaxed text-muted-foreground">
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
      <span className={isRoot ? "font-serif text-base font-medium" : "text-sm"}>
        {node.label}
      </span>
      {children.length > 0 ? (
        <ul className="ml-3 mt-1.5 space-y-1.5 border-l pl-4">
          {children.map((child) => (
            <MindmapBranch key={child.id} node={child} ancestry={next} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Mind map rendered as an interactive React Flow canvas with optional text outline view. */
function MindmapViewer({ content }: { content: LearningArtifactContent }) {
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
    <div className="mx-auto w-full max-w-5xl flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground font-medium">
          {nodes.length} concepts · {edges.length} connections
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1">
          <Button
            variant={viewMode === "flow" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("flow")}
            className="h-7 gap-1.5 px-2.5 text-xs font-medium"
          >
            <LayoutGrid className="size-3.5" />
            Interactive Diagram
          </Button>
          <Button
            variant={viewMode === "tree" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("tree")}
            className="h-7 gap-1.5 px-2.5 text-xs font-medium"
          >
            <List className="size-3.5" />
            Outline View
          </Button>
        </div>
      </div>

      {viewMode === "flow" ? (
        <MindmapFlow nodes={nodes} edges={edges} />
      ) : (
        <div className="rounded-xl border bg-card p-6 shadow-xs">
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

