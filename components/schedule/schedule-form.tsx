"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassScheduleData } from "@/types";

interface SemesterOption {
  id: string;
  name: string;
  subjects: {
    id: string;
    title: string;
  }[];
}

interface ScheduleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  schedule?: ClassScheduleData;
}

const DAY_OPTIONS = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

export function ScheduleForm({ open, onOpenChange, onSuccess, schedule }: ScheduleFormProps) {
  const [semesterOptions, setSemesterOptions] = useState<SemesterOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("2");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:30");
  const [room, setRoom] = useState("");
  const [className, setClassName] = useState("");
  const [lecturer, setLecturer] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = !!schedule;

  useEffect(() => {
    if (!open) return;

    setLoadingOptions(true);
    fetch("/api/semesters?include=subjects")
      .then(async (res) => {
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : "Gagal memuat daftar mata kuliah"
          );
        }

        return payload;
      })
      .then((data) => {
        setSemesterOptions(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        setSemesterOptions([]);
        toast.error(error instanceof Error ? error.message : "Gagal memuat daftar mata kuliah");
      })
      .finally(() => setLoadingOptions(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setSubjectId(schedule?.subjectId ?? "");
    setDayOfWeek(String(schedule?.dayOfWeek ?? 2));
    setStartTime(schedule?.startTime ?? "07:00");
    setEndTime(schedule?.endTime ?? "08:30");
    setRoom(schedule?.room ?? "");
    setClassName(schedule?.className ?? "");
    setLecturer(schedule?.lecturer ?? "");
  }, [open, schedule]);

  const flattenedSubjects = useMemo(
    () =>
      semesterOptions.flatMap((semester) =>
        semester.subjects.map((subject) => ({
          id: subject.id,
          label: `${subject.title} (${semester.name})`,
        }))
      ),
    [semesterOptions]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!subjectId) {
      toast.error("Mata kuliah wajib dipilih");
      return;
    }

    if (!startTime || !endTime || startTime >= endTime) {
      toast.error("Rentang jam kuliah tidak valid");
      return;
    }

    setSaving(true);

    try {
      const url = isEdit ? `/api/schedules/${schedule.id}` : "/api/schedules";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          dayOfWeek: Number(dayOfWeek),
          startTime,
          endTime,
          room,
          className,
          lecturer,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Gagal menyimpan jadwal");
      }

      toast.success(isEdit ? "Jadwal berhasil diperbarui" : "Jadwal berhasil ditambahkan");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan jadwal";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Jadwal Kuliah" : "Tambah Jadwal Kuliah"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Mata Kuliah</Label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={loadingOptions}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingOptions ? "Memuat mata kuliah..." : "Pilih mata kuliah"} />
              </SelectTrigger>
              <SelectContent>
                {flattenedSubjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Hari</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih hari" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_OPTIONS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Jam Mulai</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Jam Selesai</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Ruang (opsional)</Label>
            <Input
              id="room"
              value={room}
              onChange={(event) => setRoom(event.target.value)}
              placeholder="Contoh: GE-4.02 / R. Kuliah"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="className">Kelas (opsional)</Label>
            <Input
              id="className"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Contoh: Internasional EE1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lecturer">Dosen (opsional)</Label>
            <Textarea
              id="lecturer"
              rows={2}
              value={lecturer}
              onChange={(event) => setLecturer(event.target.value)}
              placeholder="Nama dosen, bisa lebih dari satu"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="cursor-pointer" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
