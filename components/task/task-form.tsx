"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TASK_STATUS, TASK_STATUS_LABELS } from "@/lib/constants";
import { TagInput } from "@/components/shared/tag-input";
import type { TagData, TaskStatus } from "@/types";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  task?: {
    id: string;
    title: string;
    description?: string | null;
    deadline?: string | null;
    status: TaskStatus;
    tags: TagData[];
  };
  onSuccess: () => void;
}

export function TaskForm({
  open,
  onOpenChange,
  subjectId,
  task,
  onSuccess,
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [deadline, setDeadline] = useState(task?.deadline?.split("T")[0] || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "TODO");
  const [tags, setTags] = useState<TagData[]>(task?.tags || []);
  const [loading, setLoading] = useState(false);
  const isEdit = !!task;

  useEffect(() => {
    if (open) {
      setTitle(task?.title || "");
      setDescription(task?.description || "");
      setDeadline(task?.deadline?.split("T")[0] || "");
      setStatus(task?.status || "TODO");
      setTags(task?.tags || []);
    }
  }, [task, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul tugas wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          deadline: deadline || null,
          status,
          subjectId,
          tagIds: tags.map((t) => t.id),
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(isEdit ? "Tugas berhasil diperbarui" : "Tugas berhasil ditambahkan");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan tugas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tugas" : "Tambah Tugas"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              placeholder="Judul tugas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi tugas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS).map(([key, value]) => (
                    <SelectItem key={key} value={value} className="cursor-pointer">
                      {TASK_STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <TagInput selectedTags={tags} onChange={setTags} />
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
