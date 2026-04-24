// Shared types matching backend contracts

export type NoteId = bigint;
export type UserId = string;
export type Timestamp = bigint;

export interface Note {
  id: NoteId;
  owner: UserId;
  content: string;
  createdAt: Timestamp;
  wordCount: bigint;
}

export interface AiResult {
  noteId: NoteId;
  shortSummary: string;
  mediumSummary: string;
  detailedSummary: string;
  keywords: string[];
  processedAt: Timestamp;
}

export type ProcessingStatus = "pending" | "processing" | "complete" | "failed";

export interface DashboardStats {
  totalNotes: bigint;
  totalWordsAnalyzed: bigint;
}

export interface CreateNoteRequest {
  content: string;
}
