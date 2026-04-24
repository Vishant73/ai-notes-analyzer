import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = Principal;
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type NoteId = bigint;
export interface Note {
    id: NoteId;
    content: string;
    owner: UserId;
    wordCount: bigint;
    createdAt: Timestamp;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface CreateNoteRequest {
    content: string;
}
export interface AiResult {
    noteId: NoteId;
    detailedSummary: string;
    shortSummary: string;
    processedAt: Timestamp;
    keywords: Array<string>;
    mediumSummary: string;
}
export interface DashboardStats {
    totalWordsAnalyzed: bigint;
    totalNotes: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum ProcessingStatus {
    pending = "pending",
    complete = "complete",
    processing = "processing",
    failed = "failed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createNote(req: CreateNoteRequest): Promise<Note>;
    deleteNote(id: NoteId): Promise<boolean>;
    getAiResult(noteId: NoteId): Promise<AiResult | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getNote(id: NoteId): Promise<Note | null>;
    getProcessingStatus(noteId: NoteId): Promise<ProcessingStatus | null>;
    isCallerAdmin(): Promise<boolean>;
    listNotes(): Promise<Array<Note>>;
    setOpenAiKey(key: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    triggerAiAnalysis(noteId: NoteId): Promise<void>;
}
