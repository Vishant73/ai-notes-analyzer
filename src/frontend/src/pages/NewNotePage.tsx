import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PlusCircle,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useBackend } from "../hooks/useBackend";

// ── Constants ──────────────────────────────────────────────────────────────────
const MIN_CHARS = 20;
const MAX_CHARS = 50_000;
const MIN_WORDS = 30;

// ── Types ──────────────────────────────────────────────────────────────────────
interface NewNoteFormValues {
  title: string;
  content: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildContent(title: string, content: string): string {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return content;
  return `[${trimmedTitle}]\n\n${content}`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function NewNotePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor, isFetching } = useBackend();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<NewNoteFormValues>({
    defaultValues: { title: "", content: "" },
    mode: "onBlur",
  });

  const contentValue = watch("content");
  const titleValue = watch("title");
  const charCount = contentValue.length;
  const wordCount = countWords(contentValue);
  const charsRemaining = MAX_CHARS - charCount;
  const isReadyForAi = wordCount >= MIN_WORDS && charCount >= MIN_CHARS;
  const isActorReady = !!actor && !isFetching;

  // ── Mutation ────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (values: NewNoteFormValues) => {
      if (!actor) throw new Error("Backend not available. Please try again.");
      const finalContent = buildContent(values.title, values.content);
      const note = await actor.createNote({ content: finalContent });
      await actor.triggerAiAnalysis(note.id);
      return note;
    },
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("Note saved! AI analysis starting…", {
        description: "Summaries and keywords will be ready shortly.",
        duration: 4000,
        icon: <Wand2 className="w-4 h-4" />,
      });
      navigate({ to: "/notes/$id", params: { id: String(note.id) } });
    },
    onError: (err: Error) => {
      toast.error("Failed to save note", {
        description: err.message || "Please try again.",
        duration: 5000,
      });
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleClear() {
    reset({ title: "", content: "" });
  }

  function onSubmit(values: NewNoteFormValues) {
    mutation.mutate(values);
  }

  const isBusy = mutation.isPending;

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      data-ocid="new_note.page"
    >
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-display-md text-foreground">New Note</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste your lecture notes or study material. AI will generate
          summaries, keywords, and quiz questions automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-6">
          {/* ── Title field ──────────────────────────────────────────────── */}
          <div className="space-y-1.5" data-ocid="new_note.title_section">
            <Label htmlFor="note-title" className="text-sm font-medium">
              Title{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="note-title"
              placeholder="e.g. Chapter 4 — Photosynthesis"
              disabled={isBusy}
              data-ocid="new_note.title_input"
              className="font-body"
              aria-describedby={errors.title ? "title-error" : undefined}
              {...register("title", {
                maxLength: {
                  value: 100,
                  message: "Title must be 100 characters or less",
                },
              })}
            />
            {errors.title && (
              <p
                id="title-error"
                className="text-xs text-destructive flex items-center gap-1"
                data-ocid="new_note.title.field_error"
              >
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {errors.title.message}
              </p>
            )}
          </div>

          {/* ── Note content card ────────────────────────────────────────── */}
          <Card
            className="border-border shadow-card"
            data-ocid="new_note.content_card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-display-sm">Note Content</CardTitle>
              <CardDescription>
                Minimum {MIN_WORDS} words recommended for high-quality AI
                analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="note-content" className="text-sm font-medium">
                  Your notes
                </Label>
                <Textarea
                  id="note-content"
                  placeholder="Paste your lecture notes, textbook excerpts, or study material here…"
                  rows={16}
                  disabled={isBusy}
                  className="resize-y font-body text-sm leading-relaxed min-h-[280px]"
                  data-ocid="new_note.content_textarea"
                  aria-describedby={
                    errors.content ? "content-error" : "content-stats"
                  }
                  {...register("content", {
                    required: "Note content cannot be empty",
                    minLength: {
                      value: MIN_CHARS,
                      message: `Notes must be at least ${MIN_CHARS} characters — add more content for AI analysis`,
                    },
                    maxLength: {
                      value: MAX_CHARS,
                      message: `Notes cannot exceed ${MAX_CHARS.toLocaleString()} characters`,
                    },
                  })}
                />
              </div>

              {/* ── Stats bar ──────────────────────────────────────────── */}
              <div
                id="content-stats"
                className="flex items-center justify-between gap-4"
                data-ocid="new_note.stats_bar"
              >
                {/* Left: word count & status */}
                <div className="flex items-center gap-2 min-w-0">
                  {isReadyForAi ? (
                    <span
                      className="badge-accent flex items-center gap-1"
                      data-ocid="new_note.word_count.success_state"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {wordCount} words — ready
                    </span>
                  ) : charCount > 0 ? (
                    <p
                      className="text-xs text-muted-foreground"
                      data-ocid="new_note.word_count_hint"
                    >
                      {wordCount} word{wordCount !== 1 ? "s" : ""}
                      {MIN_WORDS - wordCount > 0
                        ? ` · ${MIN_WORDS - wordCount} more for AI`
                        : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      At least {MIN_WORDS} words for AI analysis
                    </p>
                  )}
                </div>

                {/* Right: character counter */}
                <p
                  className={`text-xs tabular-nums flex-shrink-0 ${
                    charsRemaining < 500
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }`}
                  data-ocid="new_note.char_counter"
                >
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </p>
              </div>

              {/* ── Content validation error ────────────────────────── */}
              {errors.content && (
                <p
                  id="content-error"
                  className="text-xs text-destructive flex items-center gap-1"
                  data-ocid="new_note.content.field_error"
                >
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {errors.content.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ── AI info banner ───────────────────────────────────────────── */}
          <Card
            className="border-border bg-muted/40"
            data-ocid="new_note.ai_info_card"
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <Wand2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    What happens after saving?
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    AI will generate short, medium, and detailed summaries;
                    extract key concepts as tagged keywords; and prepare MCQ
                    revision questions — all viewable on the note detail page.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Actor not ready warning ──────────────────────────────────── */}
          {!isActorReady && (
            <div
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-4 py-3"
              data-ocid="new_note.actor.loading_state"
            >
              <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
              Connecting to backend…
            </div>
          )}

          {/* ── Mutation error ───────────────────────────────────────────── */}
          {mutation.isError && (
            <div
              className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-3 flex items-start gap-2"
              data-ocid="new_note.submit.error_state"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Unexpected error. Please try again."}
              </span>
            </div>
          )}

          {/* ── Action row ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3">
            {/* Clear button (left) */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isBusy || (charCount === 0 && titleValue.length === 0)}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="new_note.clear_button"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Clear
            </Button>

            {/* Right group */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/" })}
                disabled={isBusy}
                data-ocid="new_note.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isBusy || !isActorReady}
                data-ocid="new_note.submit_button"
                className="flex items-center gap-2 min-w-[140px] justify-center"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Save &amp; Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
