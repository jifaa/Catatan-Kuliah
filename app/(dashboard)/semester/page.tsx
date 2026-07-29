"use client";

import { useEffect, useState } from "react";
import { Plus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SemesterCard } from "@/components/semester/semester-card";
import { SemesterForm } from "@/components/semester/semester-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import type { SemesterWithCount } from "@/types";

export default function SemesterPage() {
  const [semesters, setSemesters] = useState<SemesterWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<SemesterWithCount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSemesters = () => {
    fetch("/api/semesters")
      .then((r) => r.json())
      .then(setSemesters)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/semesters/${deleteId}`, { method: "DELETE" });
      toast.success("Semester berhasil dihapus");
      fetchSemesters();
    } catch {
      toast.error("Gagal menghapus semester");
    }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Semester</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola semester dan mata kuliah
          </p>
        </div>
        <Button onClick={() => { setEditSemester(null); setFormOpen(true); }} className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Tambah Semester
        </Button>
      </div>

      {semesters.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8" />}
          title="Belum Ada Semester"
          description="Mulai dengan menambahkan semester pertamamu untuk mengorganisir mata kuliah."
          action={{
            label: "Tambah Semester",
            onClick: () => setFormOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {semesters.map((semester) => (
            <SemesterCard
              key={semester.id}
              semester={semester}
              onEdit={() => {
                setEditSemester(semester);
                setFormOpen(true);
              }}
              onDelete={() => setDeleteId(semester.id)}
            />
          ))}
        </div>
      )}

      <SemesterForm
        open={formOpen}
        onOpenChange={setFormOpen}
        semester={editSemester ?? undefined}
        onSuccess={fetchSemesters}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Hapus Semester?"
        description="Semua mata kuliah, materi, dan tugas dalam semester ini akan ikut terhapus. Tindakan ini tidak bisa dibatalkan."
        onConfirm={handleDelete}
      />
    </div>
  );
}
