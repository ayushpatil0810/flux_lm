import type { ArtifactType, LearningArtifact } from "@/lib/api";

export const ARTIFACT_TYPE_LABELS: Record<ArtifactType, string> = {
  SUMMARY: "Summary",
  TAKEAWAYS: "Key takeaways",
  FLASHCARDS: "Flashcards",
  QUIZ: "Quiz",
  MINDMAP: "Mind map",
  REPORT: "AI report",
};

export const ARTIFACT_TYPE_DESCRIPTIONS: Record<ArtifactType, string> = {
  SUMMARY: "A tight prose overview of the material.",
  TAKEAWAYS: "The main points as a scannable list.",
  FLASHCARDS: "Prompt and answer cards for review.",
  QUIZ: "Multiple-choice questions with explanations.",
  MINDMAP: "A hierarchical outline of the concepts.",
  REPORT: "A longer, structured write-up with sections.",
};

export const ARTIFACT_TYPE_ORDER: ArtifactType[] = [
  "SUMMARY",
  "TAKEAWAYS",
  "FLASHCARDS",
  "QUIZ",
  "MINDMAP",
  "REPORT",
];

/** Secondary line under an artifact title: its topic, or source count. */
export function artifactSubtitle(artifact: LearningArtifact): string | null {
  const topic = artifact.metadata?.topic;
  if (typeof topic === "string" && topic.length > 0) return topic;
  const count = artifact.sourceIds?.length ?? 0;
  if (count === 0) return null;
  return `Based on ${count} ${count === 1 ? "source" : "sources"}`;
}
