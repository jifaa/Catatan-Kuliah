"use client";

import { useState, useEffect } from "react";
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

interface MaterialFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  material?: {
    id: string;
    title: string | null;
    meetingNumber: number;
  };
  onSuccess: (materialId: string) => void;
}

export function MaterialForm({
  open,
  onOpenChange,
  subjectId,
  material,
  onSuccess,
}: MaterialFormProps) {
  const [meetingNumber, setMeetingNumber] = useState("");
  const [title, setTitle] = useState(material?.title || "");
  const [loading, setLoading] = useState(false);
  const isEdit = !!material;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setMeetingNumber(material?.meetingNumber ? String(material.meetingNumber) : "");
        setTitle(material?.title || "");
      } else {
        setMeetingNumber("");
        setTitle("");
      }
    }
  }, [material, open, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingNumber.trim()) {
      toast.error("Nomor pertemuan wajib diisi");
      return;
    }

    const parsedMeetingNumber = Number(meetingNumber);
    if (!Number.isInteger(parsedMeetingNumber) || parsedMeetingNumber < 1) {
      toast.error("Nomor pertemuan harus angka minimal 1");
      return;
    }

    const parsedTitle = title.trim();

    setLoading(true);
    try {
      const url = isEdit ? `/api/materials/${material.id}` : "/api/materials";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingNumber: parsedMeetingNumber,
          title: parsedTitle || null,
          subjectId: isEdit ? undefined : subjectId,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      toast.success(
        isEdit ? "Materi berhasil diperbarui" : "Materi berhasil ditambahkan"
      );
      onSuccess(data.id);
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan materi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Materi" : "Tambah Materi"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meetingNumber">Nomor Pertemuan</Label>
            <Input
              id="meetingNumber"
              type="number"
              min="1"
              placeholder="Contoh: 1"
              value={meetingNumber}
              onChange={(e) => setMeetingNumber(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul (opsional)</Label>
            <Input
              id="title"
              placeholder="Contoh: Pengenalan"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
