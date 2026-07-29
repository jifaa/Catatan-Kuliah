"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { BookOpen, ClipboardList, FilePenLine } from "lucide-react";
import type { MaterialSummary, SubjectNoteSummary, TaskSummary } from "@/types";
import { TASK_STATUS_LABELS } from "@/lib/constants";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    materials: MaterialSummary[];
    tasks: TaskSummary[];
    notes: (SubjectNoteSummary & {
      subject?: { id: string; title: string; semesterId: string };
    })[];
  }>({ materials: [], tasks: [], notes: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ materials: [], tasks: [], notes: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults({ materials: [], tasks: [], notes: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-muted-foreground h-9 w-56 justify-start cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-sm">Cari...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden h-9 w-9 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Cari materi atau tugas..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Mencari...
            </div>
          )}
          {!loading && !query && (
            <CommandEmpty>Ketik untuk mencari materi, tugas, atau catatan...</CommandEmpty>
          )}
          {!loading && query && results.materials.length === 0 && results.tasks.length === 0 && results.notes.length === 0 && (
            <CommandEmpty>Tidak ditemukan hasil untuk &ldquo;{query}&rdquo;</CommandEmpty>
          )}

          {results.materials.length > 0 && (
            <CommandGroup heading="Materi">
              {results.materials.map((material) => (
                <CommandItem
                  key={material.id}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }}
                  className="cursor-pointer"
                >
                  <BookOpen className="mr-2 h-4 w-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {material.title?.trim() || `Pertemuan ${material.meetingNumber}`}
                    </p>
                    <div className="flex gap-1 mt-0.5">
                      {material.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-[10px] px-1 py-0"
                          style={{ backgroundColor: tag.color + "20", color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.tasks.length > 0 && (
            <CommandGroup heading="Tugas">
              {results.tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                  }}
                  className="cursor-pointer"
                >
                  <ClipboardList className="mr-2 h-4 w-4 text-orange-500" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {TASK_STATUS_LABELS[task.status]}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.notes.length > 0 && (
            <CommandGroup heading="Catatan Bebas">
              {results.notes.map((note) => (
                <CommandItem
                  key={note.id}
                  onSelect={() => {
                    if (!note.subject) return;

                    setOpen(false);
                    setQuery("");
                    router.push(
                      `/semester/${note.subject.semesterId}/matakuliah/${note.subject.id}/catatan/${note.id}`
                    );
                  }}
                  className="cursor-pointer"
                >
                  <FilePenLine className="mr-2 h-4 w-4 text-cyan-600" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">
                      {note.title?.trim() || "Catatan bebas"}
                    </p>
                    {note.subject && (
                      <p className="text-xs text-muted-foreground">{note.subject.title}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
