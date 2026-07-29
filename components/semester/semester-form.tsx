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

interface SemesterFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semester?: {
    id: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
  };
  onSuccess: () => void;
}

export function SemesterForm({ open, onOpenChange, semester, onSuccess }: SemesterFormProps) {
  const [semesterNumber, setSemesterNumber] = useState("");
  const [name, setName] = useState(semester?.name || "");
  const [startDate, setStartDate] = useState(semester?.startDate?.split("T")[0] || "");
  const [endDate, setEndDate] = useState(semester?.endDate?.split("T")[0] || "");
  const [loading, setLoading] = useState(false);
  const isEdit = !!semester;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setName(semester?.name || "");
      } else {
        setSemesterNumber("");
      }
      setStartDate(semester?.startDate?.split("T")[0] || "");
      setEndDate(semester?.endDate?.split("T")[0] || "");
    }
  }, [semester, open, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalName = name;
    if (!isEdit && semesterNumber.trim()) {
      finalName = `Semester ${semesterNumber.trim()}`;
    }
    
    if (!finalName.trim()) {
      toast.error(isEdit ? "Nama semester wajib diisi" : "Nomor semester wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/semesters/${semester.id}` : "/api/semesters";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName.trim(),
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(isEdit ? "Semester berhasil diperbarui" : "Semester berhasil ditambahkan");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan semester");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Semester" : "Tambah Semester"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit ? (
            <div className="space-y-2">
              <Label htmlFor="name">Nama Semester</Label>
              <Input
                id="name"
                placeholder="Contoh: Semester 1 - 2025/2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="semesterNumber">Nomor Semester</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Semester</span>
                <Input
                  id="semesterNumber"
                  type="number"
                  min="1"
                  placeholder="Contoh: 1"
                  value={semesterNumber}
                  onChange={(e) => setSemesterNumber(e.target.value)}
                  autoFocus
                  className="flex-1"
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Selesai</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
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
