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

export interface ArtifactTypeStyle {
  iconBg: string;
  iconColor: string;
  iconBorder: string;
  hoverBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const ARTIFACT_TYPE_STYLES: Record<ArtifactType, ArtifactTypeStyle> = {
  SUMMARY: {
    // Blue: analytical, primary overview
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBorder: "border-blue-500/20",
    hoverBorder: "hover:border-blue-500/40",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-700 dark:text-blue-300",
    badgeBorder: "border-blue-500/20",
  },
  TAKEAWAYS: {
    // Amber: key insights & highlights
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBorder: "border-amber-500/20",
    hoverBorder: "hover:border-amber-500/40",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-700 dark:text-amber-300",
    badgeBorder: "border-amber-500/20",
  },
  FLASHCARDS: {
    // Violet: study tools & memory prompts
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBorder: "border-violet-500/20",
    hoverBorder: "hover:border-violet-500/40",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-700 dark:text-violet-300",
    badgeBorder: "border-violet-500/20",
  },
  QUIZ: {
    // Green/Teal: assessment, testing, mastery
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBorder: "border-emerald-500/20",
    hoverBorder: "hover:border-emerald-500/40",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-500/20",
  },
  MINDMAP: {
    // Cyan/Teal: connections, hierarchy, concept mapping
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    iconBorder: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-500/40",
    badgeBg: "bg-cyan-500/10",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    badgeBorder: "border-cyan-500/20",
  },
  REPORT: {
    // Violet: AI synthesis, comprehensive deep-dive
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    iconBorder: "border-violet-500/20",
    hoverBorder: "hover:border-violet-500/40",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-700 dark:text-violet-300",
    badgeBorder: "border-violet-500/20",
  },
};

/** Secondary line under an artifact title: its topic, or source count. */
export function artifactSubtitle(artifact: LearningArtifact): string | null {
  const topic = artifact.metadata?.topic;
  if (typeof topic === "string" && topic.length > 0) return topic;
  const count = artifact.sourceIds?.length ?? 0;
  if (count === 0) return null;
  return `Based on ${count} ${count === 1 ? "source" : "sources"}`;
}

/**
 * Strips date suffix (e.g., " · 9/5/2026" or " · Sep 5, 2026") from an artifact title.
 */
export function cleanArtifactTitle(title: string): string {
  if (!title) return "";
  return title
    .replace(
      /\s*·\s*(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}|\d{1,2}[-/.]\d{1,2}[-/.]\d{1,4}|[A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}|\d{1,2}\s+[A-Za-z]{3,9},?\s*\d{4}).*$/,
      "",
    )
    .replace(/\s*·\s*\d{1,4}[-/.]\d{1,2}.*$/, "")
    .trim();
}

