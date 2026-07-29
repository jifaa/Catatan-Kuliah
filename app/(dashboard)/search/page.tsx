"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  BookOpen,
  ClipboardList,
  FilePenLine,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskStatusBadge } from "@/components/task/task-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useDebounce } from "@/hooks/use-debounce";
import { formatRelative } from "@/lib/utils";
import type { MaterialSummary, SubjectNoteSummary, TaskSummary } from "@/types";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{
    materials: (MaterialSummary & { subject?: { id: string; title: string; semesterId: string } })[];
    tasks: TaskSummary[];
    notes: (SubjectNoteSummary & { subject?: { id: string; title: string; semesterId: string } })[];
  }>({ materials: [], tasks: [], notes: [] });
  const debouncedQuery = useDebounce(query, 300);
  const loading = query.trim() !== debouncedQuery.trim();

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      return;
    }

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then(setResults);
  }, [debouncedQuery]);

  const totalResults = results.materials.length + results.tasks.length + results.notes.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pencarian</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cari materi, tugas, dan catatan bebas di semua mata kuliah
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ketik kata kunci..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11"
          autoFocus
        />
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      )}

      {!loading && query && totalResults > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Ditemukan {totalResults} hasil untuk &ldquo;{query}&rdquo;
          </p>

          <Tabs defaultValue="semua">
            <TabsList>
              <TabsTrigger value="semua" className="cursor-pointer">
                Semua ({totalResults})
              </TabsTrigger>
              <TabsTrigger value="materi" className="cursor-pointer">
                Materi ({results.materials.length})
              </TabsTrigger>
              <TabsTrigger value="tugas" className="cursor-pointer">
                Tugas ({results.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="catatan" className="cursor-pointer">
                Catatan ({results.notes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="semua" className="space-y-3 mt-4">
              {results.materials.map((m) => (
                <MaterialResult key={m.id} material={m} />
              ))}
              {results.tasks.map((t) => (
                <TaskResult key={t.id} task={t} />
              ))}
              {results.notes.map((n) => (
                <NoteResult key={n.id} note={n} />
              ))}
            </TabsContent>

            <TabsContent value="materi" className="space-y-3 mt-4">
              {results.materials.map((m) => (
                <MaterialResult key={m.id} material={m} />
              ))}
            </TabsContent>

            <TabsContent value="tugas" className="space-y-3 mt-4">
              {results.tasks.map((t) => (
                <TaskResult key={t.id} task={t} />
              ))}
            </TabsContent>

            <TabsContent value="catatan" className="space-y-3 mt-4">
              {results.notes.map((n) => (
                <NoteResult key={n.id} note={n} />
              ))}
            </TabsContent>
          </Tabs>
        </>
      )}

      {!loading && query && totalResults === 0 && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Tidak Ada Hasil"
          description={`Tidak ditemukan materi, tugas, atau catatan yang cocok dengan "${query}"`}
        />
      )}

      {!query && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Cari Materi, Tugas, Catatan"
          description="Ketik kata kunci untuk mencari di semua materi, tugas, dan catatan bebas"
        />
      )}
    </div>
  );
}

function MaterialResult({
  material,
}: {
  material: MaterialSummary & { subject?: { id: string; title: string; semesterId: string } };
}) {
  const displayTitle = material.title?.trim() || `Pertemuan ${material.meetingNumber}`;
  const href = material.subject
    ? `/semester/${material.subject.semesterId}/matakuliah/${material.subject.id}/materi/${material.id}`
    : "#";

  return (
    <Link href={href}>
      <Card className="hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{displayTitle}</p>
              {material.subject && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {material.subject.title}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatRelative(material.updatedAt)}
                </span>
                {material.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                    style={{
                      backgroundColor: tag.color + "20",
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TaskResult({ task }: { task: TaskSummary }) {
  return (
    <Card className="hover:shadow-sm hover:border-primary/20 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{task.title}</p>
              <TaskStatusBadge status={task.status} />
            </div>
            {task.subject && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {task.subject.title}
              </p>
            )}
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NoteResult({
  note,
}: {
  note: SubjectNoteSummary & { subject?: { id: string; title: string; semesterId: string } };
}) {
  const href = note.subject
    ? `/semester/${note.subject.semesterId}/matakuliah/${note.subject.id}/catatan/${note.id}`
    : "#";

  return (
    <Link href={href}>
      <Card className="hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FilePenLine className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{note.title?.trim() || "Catatan bebas"}</p>
              {note.subject && (
                <p className="text-xs text-muted-foreground mt-0.5">{note.subject.title}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatRelative(note.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="animate-pulse"><div className="h-8 w-32 bg-muted rounded mb-4" /><div className="h-11 bg-muted rounded" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
