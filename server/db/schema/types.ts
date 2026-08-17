export interface SourceMetadata {
  storageKey?: string;
  bucket?: string;
  originalFilename?: string;
  totalPages?: number;
  importedFrom?: string;
  description?: string;
  pages?: string[];
  processingError?: string;
  chunkCount?: number;
  indexedAt?: string;
  [key: string]: unknown;
}

export interface SourceChunkMetadata {
  page?: number;
  sourceId?: string;
  [key: string]: unknown;
}

export interface CitationMetadata {
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  chunkId: string;
  chunkIndex: number;
  page?: number;
  excerpt?: string;
  score?: number;
  [key: string]: unknown;
}

export interface LearningArtifactMetadata {
  generatedAt?: string;
  processingError?: string;
  topic?: string;
  [key: string]: unknown;
}

export interface LearningArtifactContent {
  text?: string;
  items?: string[] | Array<Record<string, unknown>>;
  summary?: string;
  markdown?: string;
  takeaways?: string[];
  cards?: Array<{ front: string; back: string }>;
  flashcards?: Array<{ question: string; answer: string }>;
  questions?: Array<{ question: string; options: string[]; correctIndex: number; explanation?: string }>;
  quiz?: Array<{ question: string; options: string[]; answerIndex: number }>;
  nodes?: Array<{ id: string; label: string; parentId?: string }>;
  edges?: Array<{ source: string; target: string; label?: string }>;
  mindmap?: Record<string, unknown>;
  [key: string]: unknown;
}
