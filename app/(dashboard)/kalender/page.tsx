"use client";

import { useEffect, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatusBadge } from "@/components/task/task-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ScheduleForm } from "@/components/schedule/schedule-form";
import { ScheduleWeeklyGrid } from "@/components/schedule/schedule-weekly-grid";
import { cn, formatDate } from "@/lib/utils";
import type { ClassScheduleData, TaskSummary } from "@/types";
import { toast } from "sonner";

interface SemesterOption {
  id: string;
  name: string;
}

export default function KalenderPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("tasks");

  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("all");

  const [schedules, setSchedules] = useState<ClassScheduleData[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ClassScheduleData | undefined>();
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    fetch(
      `/api/tasks?from=${start.toISOString()}&to=${end.toISOString()}`
    )
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [currentMonth]);

  useEffect(() => {
    fetch("/api/semesters")
      .then((res) => res.json())
      .then((data) => setSemesters(data))
      .catch(() => setSemesters([]));
  }, []);

  const fetchSchedules = () => {
    setLoadingSchedules(true);

    const query = selectedSemesterId !== "all" ? `?semesterId=${selectedSemesterId}` : "";

    fetch(`/api/schedules${query}`)
      .then(async (res) => {
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            payload && typeof payload === "object" && "error" in payload
              ? String(payload.error)
              : "Gagal memuat jadwal kuliah"
          );
        }

        return payload;
      })
      .then((data) => {
        setSchedules(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        setSchedules([]);

        const message =
          error instanceof Error && error.message
            ? error.message
            : "Gagal memuat jadwal kuliah";

        toast.error(message);
      })
      .finally(() => setLoadingSchedules(false));
  };

  useEffect(() => {
    fetchSchedules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemesterId]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) =>
    tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), day));

  const selectedTasks = selectedDate ? getTasksForDay(selectedDate) : [];

  const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const handleDeleteSchedule = async () => {
    if (!deleteScheduleId) return;

    try {
      const response = await fetch(`/api/schedules/${deleteScheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error();
      }

      toast.success("Jadwal kuliah berhasil dihapus");
      fetchSchedules();
    } catch {
      toast.error("Gagal menghapus jadwal kuliah");
    }

    setDeleteScheduleId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kalender & Jadwal Kuliah</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola deadline tugas dan jadwal kuliah mingguan
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks">Kalender Tugas</TabsTrigger>
          <TabsTrigger value="schedules">Jadwal Kuliah</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base">
                    {format(currentMonth, "MMMM yyyy", { locale: id })}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                    {days.map((day) => {
                      const dayTasks = getTasksForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "min-h-20 p-1.5 text-left bg-background hover:bg-muted/50 transition-colors cursor-pointer flex flex-col",
                            !isCurrentMonth && "opacity-40",
                            isSelected && "bg-primary/5 ring-2 ring-primary ring-inset",
                            isToday(day) && "bg-primary/10"
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                              isToday(day) && "bg-primary text-primary-foreground"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                          <div className="flex flex-wrap gap-0.5 mt-1">
                            {dayTasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                className={cn(
                                  "w-full text-[10px] leading-tight px-1 py-0.5 rounded truncate",
                                  task.status === "DONE"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : task.status === "IN_PROGRESS"
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 3 && (
                              <span className="text-[10px] text-muted-foreground px-1">
                                +{dayTasks.length - 3} lagi
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedDate ? formatDate(selectedDate) : "Pilih tanggal"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground">
                      Klik tanggal di kalender untuk melihat tugas
                    </p>
                  ) : selectedTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada tugas pada tanggal ini
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border border-border space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{task.title}</p>
                            <TaskStatusBadge status={task.status} />
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.subject && (
                            <p className="text-xs text-primary">
                              {task.subject.title}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="pt-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="flex items-center gap-2">
              <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
                <SelectTrigger className="w-55">
                  <SelectValue placeholder="Filter semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Semester</SelectItem>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="gap-2 cursor-pointer"
              onClick={() => {
                setEditSchedule(undefined);
                setScheduleFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Tambah Jadwal
            </Button>
          </div>

          {loadingSchedules ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-36 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title="Belum Ada Jadwal Kuliah"
              description="Tambahkan jadwal kuliah mingguan agar mudah dipantau."
              action={{
                label: "Tambah Jadwal",
                onClick: () => setScheduleFormOpen(true),
              }}
            />
          ) : (
            <ScheduleWeeklyGrid
              schedules={schedules}
              onEdit={(schedule) => {
                setEditSchedule(schedule);
                setScheduleFormOpen(true);
              }}
              onDelete={(scheduleId) => setDeleteScheduleId(scheduleId)}
            />
          )}
        </TabsContent>
      </Tabs>

      <ScheduleForm
        open={scheduleFormOpen}
        onOpenChange={setScheduleFormOpen}
        schedule={editSchedule}
        onSuccess={fetchSchedules}
      />

      <ConfirmDialog
        open={!!deleteScheduleId}
        onOpenChange={() => setDeleteScheduleId(null)}
        title="Hapus Jadwal Kuliah?"
        description="Jadwal kuliah yang dihapus tidak bisa dikembalikan."
        onConfirm={handleDeleteSchedule}
      />
    </div>
  );
}
