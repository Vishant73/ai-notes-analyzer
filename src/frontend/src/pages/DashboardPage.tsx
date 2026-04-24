import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpDown,
  BookOpen,
  Calendar,
  FileText,
  Hash,
  PlusCircle,
  Search,
  SortAsc,
  Wand2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ProcessingStatus } from "../backend";
import type { Note } from "../backend.d.ts";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useBackend } from "../hooks/useBackend";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = "date" | "wordCount";

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ProcessingStatus,
  { label: string; className: string }
> = {
  [ProcessingStatus.complete]: {
    label: "Complete",
    className: "bg-accent/10 text-accent border-accent/20 border",
  },
  [ProcessingStatus.processing]: {
    label: "Processing",
    className:
      "bg-primary/10 text-primary border-primary/20 border animate-pulse",
  },
  [ProcessingStatus.pending]: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border border",
  },
  [ProcessingStatus.failed]: {
    label: "Failed",
    className:
      "bg-destructive/10 text-destructive border-destructive/20 border",
  },
};

function StatusBadge({ status }: { status: ProcessingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[ProcessingStatus.pending];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  ocid: string;
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, ocid, loading }: StatCardProps) {
  return (
    <Card className="border-border shadow-card" data-ocid={ocid}>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-mono font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-0.5" />
            ) : (
              <p className="text-3xl font-display font-bold text-foreground leading-none">
                {value}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-[18px] h-[18px] text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  const ms = Number(ts / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function notePreview(content: string): string {
  const title = content.trim().split("\n")[0].trim();
  return title.length > 100 ? `${title.slice(0, 97)}…` : title;
}

// ── Note row ─────────────────────────────────────────────────────────────────

interface NoteRowProps {
  note: Note;
  status: ProcessingStatus | null;
  index: number;
}

function NoteRow({ note, status, index }: NoteRowProps) {
  const resolvedStatus = status ?? ProcessingStatus.pending;
  return (
    <Link
      to="/notes/$id"
      params={{ id: String(note.id) }}
      className="group flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors duration-150 cursor-pointer"
      data-ocid={`dashboard.notes.item.${index}`}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-150">
        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-150" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-snug">
          {notePreview(note.content)}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {formatDate(note.createdAt)}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Hash className="w-3 h-3" />
            {note.wordCount.toString()} words
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <StatusBadge status={resolvedStatus} />
      </div>
    </Link>
  );
}

// ── Note row with live status polling ────────────────────────────────────────

type ActorType = ReturnType<typeof useBackend>["actor"];

function NoteStatusRow({
  note,
  index,
  actor,
}: {
  note: Note;
  index: number;
  actor: ActorType;
}) {
  const { data: status } = useQuery<ProcessingStatus | null>({
    queryKey: ["noteStatus", `${note.id}`],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getProcessingStatus(note.id);
      return result ?? null;
    },
    enabled: !!actor,
    refetchInterval: (query) => {
      const d = query.state.data;
      return d === ProcessingStatus.processing ||
        d === ProcessingStatus.pending ||
        d === null
        ? 5000
        : false;
    },
  });

  return <NoteRow note={note} status={status ?? null} index={index} />;
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div
      className="divide-y divide-border"
      data-ocid="dashboard.notes.loading_state"
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="w-9 h-9 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { actor, isFetching } = useBackend();

  const statsQuery = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });

  const notesQuery = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listNotes();
    },
    enabled: !!actor && !isFetching,
  });

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");

  const filteredNotes = useMemo(() => {
    const notes = notesQuery.data ?? [];
    const q = search.toLowerCase().trim();
    const filtered = q
      ? notes.filter((n) => n.content.toLowerCase().includes(q))
      : notes;
    return [...filtered].sort((a, b) => {
      if (sortKey === "date") return Number(b.createdAt - a.createdAt);
      return Number(b.wordCount - a.wordCount);
    });
  }, [notesQuery.data, search, sortKey]);

  const isLoading = notesQuery.isLoading || (isFetching && !notesQuery.data);
  const stats = statsQuery.data;
  const notesList = notesQuery.data ?? [];

  const aiAnalysesCount = notesList.length;
  const avgWords =
    notesList.length > 0
      ? Math.round(
          notesList.reduce((acc, n) => acc + Number(n.wordCount), 0) /
            notesList.length,
        ).toLocaleString()
      : "—";

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      data-ocid="dashboard.page"
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display-md text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your notes, summaries, and AI insights
          </p>
        </div>
        <Link to="/notes/new">
          <Button
            className="flex items-center gap-2"
            data-ocid="dashboard.new_note_button"
          >
            <PlusCircle className="w-4 h-4" />
            New Note
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        data-ocid="dashboard.stats_section"
      >
        <StatCard
          label="Total Notes"
          value={stats ? stats.totalNotes.toString() : "0"}
          icon={FileText}
          ocid="dashboard.stat.total_notes"
          loading={statsQuery.isLoading}
        />
        <StatCard
          label="Words Analyzed"
          value={
            stats ? Number(stats.totalWordsAnalyzed).toLocaleString() : "0"
          }
          icon={BookOpen}
          ocid="dashboard.stat.total_words"
          loading={statsQuery.isLoading}
        />
        <StatCard
          label="AI Analyses"
          value={aiAnalysesCount.toString()}
          icon={Wand2}
          ocid="dashboard.stat.ai_analyses"
          loading={notesQuery.isLoading}
        />
        <StatCard
          label="Avg. Note Length"
          value={avgWords}
          icon={Hash}
          ocid="dashboard.stat.avg_length"
          loading={notesQuery.isLoading}
        />
      </div>

      {/* Notes section */}
      <Card
        className="border-border shadow-card"
        data-ocid="dashboard.notes_section"
      >
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1">
              <CardTitle className="text-display-sm">My Notes</CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {notesList.length} notes
              </Badge>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8 h-8 text-sm bg-background"
                placeholder="Search notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-ocid="dashboard.search_input"
              />
            </div>

            <div
              className="flex items-center gap-1 flex-shrink-0"
              data-ocid="dashboard.sort_controls"
            >
              <Button
                variant={sortKey === "date" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setSortKey("date")}
                data-ocid="dashboard.sort.date_tab"
              >
                <ArrowUpDown className="w-3 h-3" />
                Date
              </Button>
              <Button
                variant={sortKey === "wordCount" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setSortKey("wordCount")}
                data-ocid="dashboard.sort.wordcount_tab"
              >
                <SortAsc className="w-3 h-3" />
                Words
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonRows />
          ) : filteredNotes.length === 0 && search.trim().length > 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-center px-4"
              data-ocid="dashboard.notes.empty_state"
            >
              <Search className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                No notes match &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                Try a different search term.
              </p>
            </div>
          ) : notesList.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center px-4"
              data-ocid="dashboard.notes.empty_state"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                No notes yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                Paste your lecture notes or study material to get AI-generated
                summaries, keywords, and quiz questions.
              </p>
              <Link to="/notes/new">
                <Button
                  size="sm"
                  data-ocid="dashboard.empty_state.new_note_button"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add your first note
                </Button>
              </Link>
            </div>
          ) : (
            <div
              className="divide-y divide-border"
              data-ocid="dashboard.notes.list"
            >
              {filteredNotes.map((note, i) => (
                <NoteStatusRow
                  key={`${note.id}`}
                  note={note}
                  index={i + 1}
                  actor={actor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
