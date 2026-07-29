"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Separator } from "@/components/ui/separator";
import { useAutosave } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SubjectNoteDetail } from "@/types";

export default function SubjectNoteEditorPage({
  params,
}: {
  params: Promise<{
    semesterId: string;
    subjectId: string;
    noteId: string;
  }>;
}) {
  const { semesterId, subjectId, noteId } = use(params);
  const [note, setNote] = useState<SubjectNoteDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string | Record<string, unknown>>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/notes/${noteId}`)
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | SubjectNoteDetail
          | { error?: string }
          | null;

        if (!response.ok) {
          const message = payload && "error" in payload ? payload.error ?? "Gagal memuat catatan" : "Gagal memuat catatan";
          throw new Error(message);
        }

        return payload as SubjectNoteDetail;
      })
      .then((data) => {
        setNote(data);
        setTitle(data.title ?? "");
        setContent(data.content);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Gagal memuat catatan";
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [noteId]);

  const save = useCallback(async () => {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || null,
        content: typeof content === 'string' ? content : JSON.stringify(content),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Gagal menyimpan catatan");
    }
  }, [noteId, title, content]);

  const saveStatus = useAutosave(save, [title, content]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-12 w-full bg-muted rounded" />
        <div className="h-96 w-full bg-muted rounded" />
      </div>
    );
  }

  if (!note) {
    return <p className="text-muted-foreground">Catatan tidak ditemukan.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href={`/semester/${semesterId}/matakuliah/${subjectId}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-muted-foreground">
              {note.subject.semester.name} / {note.subject.title}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
            saveStatus === "saving" && "text-yellow-600",
            saveStatus === "saved" && "text-green-600",
            saveStatus === "error" && "text-red-600",
            saveStatus === "idle" && "text-muted-foreground"
          )}
        >
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Menyimpan...
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-3 w-3" />
              Tersimpan
            </>
          )}
          {saveStatus === "error" && (
            <>
              <AlertCircle className="h-3 w-3" />
              Gagal menyimpan
            </>
          )}
        </div>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul catatan (opsional)"
        className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
      />

      <Separator />

      <TiptapEditor content={content} onChange={setContent} />
    </div>
  );
}
