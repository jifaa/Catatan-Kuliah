"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { SubjectNoteSummary } from "@/types";

interface NoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  note?: SubjectNoteSummary;
  onSuccess: (noteId: string) => void;
}

export function NoteForm({
  open,
  onOpenChange,
  subjectId,
  note,
  onSuccess,
}: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [loading, setLoading] = useState(false);
  const isEdit = !!note;

  useEffect(() => {
    if (!open) return;
    setTitle(note?.title || "");
  }, [note, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/notes/${note.id}` : "/api/notes";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: isEdit ? undefined : subjectId,
          title: title.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Gagal menyimpan catatan");
      }

      const data = await response.json();
      toast.success(isEdit ? "Judul catatan diperbarui" : "Catatan berhasil dibuat");
      onSuccess(data.id);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan catatan";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Judul Catatan" : "Tambah Catatan Bebas"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="noteTitle">Judul (opsional)</Label>
            <Input
              id="noteTitle"
              placeholder="Contoh: Ringkasan UTS"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Simpan" : "Buat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
