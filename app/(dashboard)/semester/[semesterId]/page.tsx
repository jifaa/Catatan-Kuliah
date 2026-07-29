"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Plus, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubjectCard } from "@/components/subject/subject-card";
import { SubjectForm } from "@/components/subject/subject-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import type { SemesterWithSubjects } from "@/types";

export default function SemesterDetailPage({
  params,
}: {
  params: Promise<{ semesterId: string }>;
}) {
  const { semesterId } = use(params);
  const [data, setData] = useState<SemesterWithSubjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<{ id: string; title: string; description?: string | null } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = () => {
    fetch(`/api/semesters/${semesterId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semesterId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/subjects/${deleteId}`, { method: "DELETE" });
      toast.success("Mata kuliah berhasil dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus mata kuliah");
    }
    setDeleteId(null);
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await fetch(`/api/subjects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPinned }),
      });
      fetchData();
    } catch {
      toast.error("Gagal mengubah pin");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Semester tidak ditemukan.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/semester">
              <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{data.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-9">
            {data.subjects.length} Mata Kuliah
          </p>
        </div>
        <Button
          onClick={() => {
            setEditSubject(null);
            setFormOpen(true);
          }}
          className="gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tambah Mata Kuliah
        </Button>
      </div>

      {data.subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="Belum Ada Mata Kuliah"
          description="Tambahkan mata kuliah untuk mulai mencatat materi dan tugas."
          action={{
            label: "Tambah Mata Kuliah",
            onClick: () => setFormOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              semesterId={semesterId}
              onEdit={() => {
                setEditSubject(subject);
                setFormOpen(true);
              }}
              onDelete={() => setDeleteId(subject.id)}
              onTogglePin={() => handleTogglePin(subject.id, subject.pinned)}
            />
          ))}
        </div>
      )}

      <SubjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        semesterId={semesterId}
        subject={editSubject ?? undefined}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Hapus Mata Kuliah?"
        description="Semua materi dan tugas dalam mata kuliah ini akan ikut terhapus. Tindakan ini tidak bisa dibatalkan."
        onConfirm={handleDelete}
      />
    </div>
  );
}
