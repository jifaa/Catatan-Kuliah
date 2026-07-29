"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowLeft,
  FileText,
  ClipboardList,
  Paperclip,
  FilePenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialCard } from "@/components/material/material-card";
import { MaterialForm } from "@/components/material/material-form";
import { TaskCard } from "@/components/task/task-card";
import { TaskForm } from "@/components/task/task-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgressBar } from "@/components/shared/progress-bar";
import { FileList } from "@/components/upload/file-list";
import { SubjectAttachmentForm } from "@/components/upload/subject-attachment-form";
import { NoteCard } from "@/components/note/note-card";
import { NoteForm } from "@/components/note/note-form";
import { SortableList } from "@/components/shared/sortable-list";
import { toast } from "sonner";
import type { SubjectDetail, TaskStatus } from "@/types";

export default function SubjectDetailPage({
  params,
}: {
  params: Promise<{ semesterId: string; subjectId: string }>;
}) {
  const { semesterId, subjectId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<SubjectDetail | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [attachmentFormOpen, setAttachmentFormOpen] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<SubjectDetail["tasks"][0] | null>(null);
  const [editNote, setEditNote] = useState<SubjectDetail["notes"][0] | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "material" | "task" | "note"; id: string } | null>(null);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);

  const parseJsonSafely = async <T,>(response: Response): Promise<T | null> => {
    const text = await response.text();

    if (!text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  };

  const isSubjectDetail = (value: unknown): value is SubjectDetail => {
    if (!value || typeof value !== "object") {
      return false;
    }

    return "id" in value && "title" in value && "semester" in value;
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(`/api/subjects/${subjectId}`);
      const payload = await parseJsonSafely<SubjectDetail | { error?: string }>(response);

      if (response.status === 404) {
        setData(null);
        return;
      }

      if (!response.ok) {
        setFetchError(payload && "error" in payload ? payload.error ?? "Gagal memuat mata kuliah." : "Gagal memuat mata kuliah.");
        setData(null);
        return;
      }

      if (!isSubjectDetail(payload)) {
        setFetchError("Respons server tidak valid.");
        setData(null);
        return;
      }

      setData(payload);
    } catch {
      setFetchError("Tidak dapat terhubung ke server.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const handleCreateMaterial = (materialId: string) => {
    router.push(
      `/semester/${semesterId}/matakuliah/${subjectId}/materi/${materialId}`
    );
  };


  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const url =
        deleteTarget.type === "material"
          ? `/api/materials/${deleteTarget.id}`
          : deleteTarget.type === "task"
            ? `/api/tasks/${deleteTarget.id}`
            : `/api/notes/${deleteTarget.id}`;
      await fetch(url, { method: "DELETE" });
      toast.success(
        deleteTarget.type === "material"
          ? "Materi berhasil dihapus"
          : deleteTarget.type === "task"
            ? "Tugas berhasil dihapus"
            : "Catatan berhasil dihapus"
      );
      fetchData();
    } catch {
      toast.error("Gagal menghapus");
    }
    setDeleteTarget(null);
  };

  const handleTogglePinMaterial = async (id: string, currentPinned: boolean) => {
    try {
      await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPinned }),
      });
      fetchData();
    } catch {
      toast.error("Gagal mengubah pin");
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleTogglePinNote = async (id: string, currentPinned: boolean) => {
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPinned }),
      });
      fetchData();
    } catch {
      toast.error("Gagal mengubah pin");
    }
  };

  const handleReorderNotes = async (items: SubjectDetail["notes"]) => {
    setData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        notes: items,
      };
    });

    try {
      await fetch("/api/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          items: items.map((note, index) => ({ id: note.id, order: index })),
        }),
      });
    } catch {
      toast.error("Gagal mengubah urutan catatan");
      fetchData();
    }
  };

  const handleDeleteAttachment = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        attachments: prev.attachments.filter((attachment) => attachment.id !== id),
      };
    });
  };

  const handleAttachmentUploadComplete = (newAttachments: SubjectDetail["attachments"]) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        attachments: [...newAttachments, ...prev.attachments],
      };
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" suppressHydrationWarning>
        <div className="h-8 w-48 bg-muted rounded" suppressHydrationWarning />
        <div className="h-10 w-64 bg-muted rounded" suppressHydrationWarning />
        <div className="space-y-3" suppressHydrationWarning>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" suppressHydrationWarning />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    if (fetchError) {
      return <p className="text-destructive">{fetchError}</p>;
    }

    return <p className="text-muted-foreground">Mata kuliah tidak ditemukan.</p>;
  }

  const doneCount = data.tasks.filter((t) => t.status === "DONE").length;
  const taskProgress = data.tasks.length > 0 ? (doneCount / data.tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/semester/${semesterId}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="text-xs text-muted-foreground">{data.semester.name}</p>
              <h1 className="text-2xl font-bold">{data.title}</h1>
            </div>
          </div>
          {data.description && (
            <p className="text-sm text-muted-foreground ml-9">{data.description}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      {data.tasks.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Progress Tugas</p>
            <p className="text-sm text-muted-foreground">
              {doneCount} / {data.tasks.length} selesai
            </p>
          </div>
          <ProgressBar value={taskProgress} showLabel={false} />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="materi">
        <TabsList>
          <TabsTrigger value="materi" className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4" />
            Materi ({data.materials.length})
          </TabsTrigger>
          <TabsTrigger value="tugas" className="gap-2 cursor-pointer">
            <ClipboardList className="h-4 w-4" />
            Tugas ({data.tasks.length})
          </TabsTrigger>
          <TabsTrigger value="catatan" className="gap-2 cursor-pointer">
            <FilePenLine className="h-4 w-4" />
            Catatan Bebas ({data.notes.length})
          </TabsTrigger>
          <TabsTrigger value="lampiran" className="gap-2 cursor-pointer">
            <Paperclip className="h-4 w-4" />
            Lampiran ({data.attachments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materi" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setMaterialFormOpen(true)} className="gap-2 cursor-pointer">
              <Plus className="h-4 w-4" />
              Tambah Materi
            </Button>
          </div>

          {data.materials.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Belum Ada Materi"
              description="Tambahkan materi kuliah pertama untuk mulai mencatat."
              action={{
                label: "Tambah Materi",
                onClick: () => setMaterialFormOpen(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  href={`/semester/${semesterId}/matakuliah/${subjectId}/materi/${material.id}`}
                  onDelete={() =>
                    setDeleteTarget({ type: "material", id: material.id })
                  }
                  onTogglePin={() =>
                    handleTogglePinMaterial(material.id, material.pinned)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tugas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditTask(null);
                setTaskFormOpen(true);
              }}
              className="gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Tugas
            </Button>
          </div>

          {data.tasks.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="Belum Ada Tugas"
              description="Tambahkan tugas untuk mulai tracking deadline."
              action={{
                label: "Tambah Tugas",
                onClick: () => setTaskFormOpen(true),
              }}
            />
          ) : (
            <div className="space-y-2">
              {data.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => {
                    setEditTask(task);
                    setTaskFormOpen(true);
                  }}
                  onDelete={() =>
                    setDeleteTarget({ type: "task", id: task.id })
                  }
                  onStatusChange={(status) =>
                    handleStatusChange(task.id, status)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="catatan" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditNote(null);
                setNoteFormOpen(true);
              }}
              className="gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Catatan
            </Button>
          </div>

          {data.notes.length === 0 ? (
            <EmptyState
              icon={<FilePenLine className="h-8 w-8" />}
              title="Belum Ada Catatan Bebas"
              description="Tambahkan catatan bebas untuk ringkasan, ide, atau kisi-kisi ujian."
              action={{
                label: "Tambah Catatan",
                onClick: () => {
                  setEditNote(null);
                  setNoteFormOpen(true);
                },
              }}
            />
          ) : (
            <SortableList
              items={data.notes}
              onReorder={handleReorderNotes}
              className="pl-4"
              renderItem={(note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  href={`/semester/${semesterId}/matakuliah/${subjectId}/catatan/${note.id}`}
                  onDelete={() => setDeleteTarget({ type: "note", id: note.id })}
                  onTogglePin={() => handleTogglePinNote(note.id, note.pinned)}
                  onEdit={() => {
                    setEditNote(note);
                    setNoteFormOpen(true);
                  }}
                />
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="lampiran" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setAttachmentFormOpen(true)}
              className="gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah Lampiran
            </Button>
          </div>

          {data.attachments.length === 0 ? (
            <EmptyState
              icon={<Paperclip className="h-8 w-8" />}
              title="Belum Ada Lampiran"
              description="Tambahkan lampiran umum untuk mata kuliah ini."
              action={{
                label: "Tambah Lampiran",
                onClick: () => setAttachmentFormOpen(true),
              }}
            />
          ) : (
            <FileList attachments={data.attachments} onDelete={handleDeleteAttachment} />
          )}
        </TabsContent>
      </Tabs>

      <SubjectAttachmentForm
        open={attachmentFormOpen}
        onOpenChange={setAttachmentFormOpen}
        subjectId={subjectId}
        onSuccess={(newAttachments) =>
          handleAttachmentUploadComplete(newAttachments as SubjectDetail["attachments"])
        }
      />

      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        subjectId={subjectId}
        task={editTask ?? undefined}
        onSuccess={fetchData}
      />

      <NoteForm
        open={noteFormOpen}
        onOpenChange={setNoteFormOpen}
        subjectId={subjectId}
        note={editNote ?? undefined}
        onSuccess={(noteId) => {
          fetchData();

          if (!editNote) {
            router.push(`/semester/${semesterId}/matakuliah/${subjectId}/catatan/${noteId}`);
          }
        }}
      />

      <MaterialForm
        open={materialFormOpen}
        onOpenChange={setMaterialFormOpen}
        subjectId={subjectId}
        onSuccess={handleCreateMaterial}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={
          deleteTarget?.type === "material"
            ? "Hapus Materi?"
            : deleteTarget?.type === "task"
              ? "Hapus Tugas?"
              : "Hapus Catatan?"
        }
        description="Tindakan ini tidak bisa dibatalkan."
        onConfirm={handleDelete}
      />
    </div>
  );
}
