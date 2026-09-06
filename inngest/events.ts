/**
 * Constants for Inngest event names used across background functions and trigger dispatches.
 */
export const INNGEST_EVENTS = {
  SOURCE_CREATED: "source/created",
  CONVERSATION_SUMMARIZE: "conversation/summarize",
  ARTIFACT_GENERATE: "artifact/generate",
} as const;

