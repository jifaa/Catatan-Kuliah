"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

interface SubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterId: string;
  subject?: {
    id: string;
    title: string;
    description?: string | null;
  };
  onSuccess: () => void;
}

export function SubjectForm({
  open,
  onOpenChange,
  semesterId,
  subject,
  onSuccess,
}: SubjectFormProps) {
  const [title, setTitle] = useState(subject?.title || "");
  const [description, setDescription] = useState(subject?.description || "");
  const [loading, setLoading] = useState(false);
  const isEdit = !!subject;

  useEffect(() => {
    if (open) {
      setTitle(subject?.title || "");
      setDescription(subject?.description || "");
    }
  }, [subject, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul mata kuliah wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/subjects/${subject.id}` : "/api/subjects";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          semesterId,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(
        isEdit ? "Mata kuliah berhasil diperbarui" : "Mata kuliah berhasil ditambahkan"
      );
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan mata kuliah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              placeholder="Contoh: Algoritma & Struktur Data"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi singkat mata kuliah..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="cursor-pointer">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
