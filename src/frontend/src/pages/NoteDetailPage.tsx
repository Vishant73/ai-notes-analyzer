import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronRight,
  Hash,
  Loader2,
  RefreshCw,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { ProcessingStatus } from "../backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useBackend } from "../hooks/useBackend";

// ── helpers ────────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

function isPolling(status: ProcessingStatus | null | undefined): boolean {
  return (
    status === ProcessingStatus.pending ||
    status === ProcessingStatus.processing
  );
}

type StatusVariant = "pending" | "processing" | "complete" | "failed";

const STATUS_LABELS: Record<StatusVariant, string> = {
  pending: "Pending",
  processing: "Analyzing…",
  complete: "Complete",
  failed: "Failed",
};

const STATUS_CLASSES: Record<StatusVariant, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  processing: "bg-primary/10 text-primary border-primary/20",
  complete: "bg-accent/10 text-accent border-accent/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

function statusKey(s: ProcessingStatus | null): StatusVariant {
  if (s === ProcessingStatus.complete) return "complete";
  if (s === ProcessingStatus.processing) return "processing";
  if (s === ProcessingStatus.failed) return "failed";
  return "pending";
}

// ── sub-components ──────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      data-ocid="note_detail.loading_state"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-8 w-40" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  text: string;
  ocid: string;
}
function SummaryCard({ label, text, ocid }: SummaryCardProps) {
  return (
    <Card className="border-border shadow-card flex flex-col" data-ocid={ocid}>
      <CardHeader className="pb-2 border-b border-border">
        <CardTitle className="text-sm font-display font-semibold tracking-tight">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        <p className="text-sm text-foreground leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
}

// ── main page ──────────────────────────────────────────────────────────────────

export default function NoteDetailPage() {
  const { id } = useParams({ from: "/notes/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor, isFetching: actorLoading } = useBackend();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const noteId = BigInt(id);

  // ── queries ────────────────────────────────────────────────────────────────

  const { data: note, isLoading: noteLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getNote(noteId);
    },
    enabled: !!actor && !actorLoading,
  });

  const { data: status } = useQuery({
    queryKey: ["note-status", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProcessingStatus(noteId);
    },
    enabled: !!actor && !actorLoading,
    refetchInterval: (query) => {
      const s = query.state.data;
      return isPolling(s) ? 5_000 : false;
    },
  });

  const { data: aiResult } = useQuery({
    queryKey: ["note-ai-result", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAiResult(noteId);
    },
    enabled: !!actor && !actorLoading && status === ProcessingStatus.complete,
  });

  // ── mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.deleteNote(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      navigate({ to: "/" });
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.triggerAiAnalysis(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-status", id] });
      queryClient.invalidateQueries({ queryKey: ["note-ai-result", id] });
    },
  });

  // ── loading/error states ────────────────────────────────────────────────────

  const isLoading = noteLoading || actorLoading;
  if (isLoading) return <LoadingSkeleton />;

  if (!note) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center"
        data-ocid="note_detail.error_state"
      >
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-display-sm text-foreground mb-2">Note not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This note doesn't exist or you don't have access to it.
        </p>
        <Link to="/">
          <Button variant="outline" size="sm" data-ocid="note_detail.back_link">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const sv = statusKey(status ?? null);

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      data-ocid="note_detail.page"
    >
      {/* ── breadcrumb + action bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/" data-ocid="note_detail.back_link">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <h1 className="text-display-sm text-foreground truncate">
            Note #{id}
          </h1>
          <span
            className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border flex-shrink-0 ${STATUS_CLASSES[sv]}`}
            data-ocid="note_detail.status_badge"
          >
            {STATUS_LABELS[sv]}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending || isPolling(status)}
            className="hidden sm:flex items-center gap-1.5 transition-colors duration-200"
            data-ocid="note_detail.reanalyze_button"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Re-analyze
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-1.5 text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive transition-colors duration-200"
            data-ocid="note_detail.delete_button"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* ── note metadata strip ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(note.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="w-3.5 h-3.5" />
          <span>{Number(note.wordCount).toLocaleString()} words</span>
        </div>
        {/* mobile status badge */}
        <span
          className={`sm:hidden inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${STATUS_CLASSES[sv]}`}
        >
          {STATUS_LABELS[sv]}
        </span>
      </div>

      {/* ── original notes ──────────────────────────────────────────────────── */}
      <Card
        className="border-border shadow-card"
        data-ocid="note_detail.original_content_card"
      >
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <CardTitle className="text-display-sm">Original Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <pre
            className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words font-body max-h-80 overflow-y-auto"
            data-ocid="note_detail.content_text"
          >
            {note.content}
          </pre>
        </CardContent>
      </Card>

      {/* ── AI analysis section ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <h2 className="text-display-sm">AI Analysis</h2>
          </div>
          {/* Mobile re-analyze */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending || isPolling(status)}
            className="sm:hidden flex items-center gap-1.5 transition-colors duration-200"
            data-ocid="note_detail.reanalyze_button_mobile"
          >
            {analyzeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Re-analyze
          </Button>
        </div>

        {/* Pending / processing */}
        {(sv === "pending" || sv === "processing") && (
          <Card
            className="border-primary/20 bg-primary/5"
            data-ocid="note_detail.processing_state"
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    AI is analyzing your notes…
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This usually takes 10–30 seconds. Results will appear
                    automatically — no need to refresh.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed */}
        {sv === "failed" && (
          <Card
            className="border-destructive/30 bg-destructive/5"
            data-ocid="note_detail.failed_state"
          >
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-destructive/10 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive mb-1">
                    Analysis failed
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    The AI encountered an error processing your notes. You can
                    retry the analysis below.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => analyzeMutation.mutate()}
                    disabled={analyzeMutation.isPending}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-colors duration-200"
                    data-ocid="note_detail.retry_button"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Retrying…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not yet triggered */}
        {status === null && sv === "pending" && (
          <Card
            className="border-border bg-muted/40"
            data-ocid="note_detail.no_analysis_state"
          >
            <CardContent className="pt-6 pb-6 flex flex-col items-center text-center gap-3">
              <Wand2 className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No AI analysis yet
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Trigger AI analysis to generate summaries and extract keywords
                  from your notes.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                data-ocid="note_detail.trigger_analysis_button"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Analyze Notes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Complete — summaries + keywords */}
        {sv === "complete" && aiResult && (
          <div className="space-y-4" data-ocid="note_detail.ai_results_section">
            {/* Keywords */}
            <Card
              className="border-border shadow-card"
              data-ocid="note_detail.keywords_card"
            >
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-display-sm">Keywords</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {aiResult.keywords.length > 0 ? (
                  <div
                    className="flex flex-wrap gap-2"
                    data-ocid="note_detail.keywords_list"
                  >
                    {aiResult.keywords.map((kw, i) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="badge-accent font-mono text-xs px-2.5 py-0.5"
                        data-ocid={`note_detail.keyword.${i + 1}`}
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p
                    className="text-sm text-muted-foreground italic"
                    data-ocid="note_detail.keywords_card.empty_state"
                  >
                    No keywords extracted.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 3-column summary grid */}
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
              data-ocid="note_detail.summaries_section"
            >
              <SummaryCard
                label="Short Summary"
                text={aiResult.shortSummary}
                ocid="note_detail.summary_short_card"
              />
              <SummaryCard
                label="Medium Summary"
                text={aiResult.mediumSummary}
                ocid="note_detail.summary_medium_card"
              />
              <SummaryCard
                label="Detailed Summary"
                text={aiResult.detailedSummary}
                ocid="note_detail.summary_detailed_card"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── delete confirmation dialog ──────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="note_detail.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the note and all associated AI
              results including summaries and keywords. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              data-ocid="note_detail.delete_cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-200"
              data-ocid="note_detail.delete_confirm_button"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Note"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
