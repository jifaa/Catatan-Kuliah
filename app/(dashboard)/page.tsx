"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskStatusBadge } from "@/components/task/task-status-badge";
import {
  cn,
  formatDate,
  formatRelative,
  getDeadlineReminderLabel,
  getDeadlineReminderLevel,
  isDueSoon,
  isOverdue,
  type ReminderLevel,
} from "@/lib/utils";
import type { RecentActivityItem, TaskSummary, SemesterWithCount } from "@/types";

async function fetchJsonOrFallback<T>(url: string, fallbackValue: T): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) return fallbackValue;

    const text = await response.text();
    if (!text.trim()) return fallbackValue;

    return JSON.parse(text) as T;
  } catch {
    return fallbackValue;
  }
}

export default function DashboardPage() {
  const [semesters, setSemesters] = useState<SemesterWithCount[]>([]);
  const [allTasks, setAllTasks] = useState<TaskSummary[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<TaskSummary[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchJsonOrFallback<SemesterWithCount[]>("/api/semesters", []),
      fetchJsonOrFallback<TaskSummary[]>("/api/tasks", []),
      fetchJsonOrFallback<RecentActivityItem[]>("/api/activity/recent?limit=4", []),
    ])
      .then(([sem, tasks, activities]) => {
        setSemesters(sem);
        const taskList = tasks;
        setAllTasks(taskList);
        setRecentActivities(activities);

        // Sort tasks by deadline, filter non-done
        const sorted = taskList
          .filter((t) => t.status !== "DONE" && t.deadline)
          .sort(
            (a, b) =>
              new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
          )
          .slice(0, 5);
        setUpcomingTasks(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeReminderTasks = useMemo(
    () =>
      allTasks
        .filter((task) => task.status !== "DONE" && task.deadline)
        .filter((task) => getDeadlineReminderLevel(task.deadline!) !== "NONE")
        .sort(
          (a, b) =>
            new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
        ),
    [allTasks]
  );

  const reminderTasks = activeReminderTasks.slice(0, 6);

  const reminderCounts = useMemo(
    () =>
      activeReminderTasks.reduce(
        (accumulator, task) => {
          const level = getDeadlineReminderLevel(task.deadline!);
          if (level === "OVERDUE") accumulator.overdue += 1;
          if (level === "TODAY") accumulator.today += 1;
          if (level === "SOON") accumulator.soon += 1;
          return accumulator;
        },
        { overdue: 0, today: 0, soon: 0 }
      ),
    [activeReminderTasks]
  );

  useEffect(() => {
    if (loading) return;

    const totalReminder = reminderCounts.overdue + reminderCounts.today + reminderCounts.soon;
    if (totalReminder === 0) return;

    const todayKey = new Date().toISOString().slice(0, 10);
    const reminderStorageKey = `task-reminder-${todayKey}`;
    if (localStorage.getItem(reminderStorageKey)) return;

    const messageParts = [
      reminderCounts.overdue > 0 ? `${reminderCounts.overdue} terlambat` : null,
      reminderCounts.today > 0 ? `${reminderCounts.today} hari ini` : null,
      reminderCounts.soon > 0 ? `${reminderCounts.soon} mendekati deadline` : null,
    ].filter(Boolean);

    toast.warning(`Reminder tugas: ${messageParts.join(", ")}.`, {
      description: "Cek panel Reminder Deadline untuk detail.",
      duration: 7000,
    });

    localStorage.setItem(reminderStorageKey, "shown");
  }, [loading, reminderCounts]);

  const totalSubjects = semesters.reduce((acc, s) => acc + s._count.subjects, 0);

  const getReminderBadgeClassName = (level: ReminderLevel) => {
    if (level === "OVERDUE") {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }

    if (level === "TODAY") {
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    }

    if (level === "SOON") {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }

    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Selamat datang di Catatan Kuliah. Kelola materi dan tugas perkuliahanmu.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{semesters.length}</p>
              <p className="text-xs text-muted-foreground">Semester</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSubjects}</p>
              <p className="text-xs text-muted-foreground">Mata Kuliah</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingTasks.length}</p>
              <p className="text-xs text-muted-foreground">Tugas Aktif</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {upcomingTasks.filter((t) => t.deadline && isOverdue(t.deadline)).length}
              </p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Reminder Deadline</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              Terlambat ({reminderCounts.overdue})
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Hari ini ({reminderCounts.today})
            </Badge>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              H-3 ({reminderCounts.soon})
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {reminderTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1 text-center">
              Tidak ada reminder deadline saat ini.
            </p>
          ) : (
            reminderTasks.map((task) => {
              const level = getDeadlineReminderLevel(task.deadline!);

              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {task.subject && <span className="truncate">{task.subject.title}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.deadline ? formatDate(task.deadline) : "Tanpa deadline"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className={getReminderBadgeClassName(level)}>
                      {task.deadline ? getDeadlineReminderLabel(task.deadline) : "Nanti"}
                    </Badge>
                    {task.subject && (
                      <Link href={`/semester/${task.subject.semesterId}/matakuliah/${task.subject.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 cursor-pointer">
                          Buka
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-1 cursor-pointer">
              Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1 text-center">
              Belum ada aktivitas terbaru.
            </p>
          ) : (
            recentActivities.map((activity) => {
              const detailHref =
                activity.type === "MATERIAL"
                  ? `/semester/${activity.subject.semesterId}/matakuliah/${activity.subject.id}/materi/${activity.id}`
                  : activity.type === "NOTE"
                    ? `/semester/${activity.subject.semesterId}/matakuliah/${activity.subject.id}/catatan/${activity.id}`
                    : `/semester/${activity.subject.semesterId}/matakuliah/${activity.subject.id}`;

              const activityLabel =
                activity.type === "TASK"
                  ? "Tugas"
                  : activity.type === "NOTE"
                    ? "Catatan"
                    : "Materi";

              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="shrink-0">
                        {activityLabel}
                      </Badge>
                      <p className="truncate text-sm font-medium">{activity.title}</p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {activity.subject.title} • Diperbarui {formatRelative(activity.updatedAt)}
                    </p>
                  </div>

                  <Link href={detailHref}>
                    <Button variant="ghost" size="sm" className="h-7 px-2 shrink-0 cursor-pointer">
                      Buka
                    </Button>
                  </Link>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Tugas Mendatang</CardTitle>
            <Link href="/kalender">
              <Button variant="ghost" size="sm" className="gap-1 cursor-pointer">
                Lihat Semua <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Tidak ada tugas mendatang 🎉
              </p>
            ) : (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors",
                    task.deadline && isOverdue(task.deadline) && "bg-red-50 dark:bg-red-950/20"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.subject && (
                      <p className="text-xs text-muted-foreground truncate">
                        {task.subject.title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.deadline && (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isOverdue(task.deadline)
                            ? "text-red-500"
                            : isDueSoon(task.deadline)
                            ? "text-yellow-600"
                            : "text-muted-foreground"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(task.deadline)}
                      </div>
                    )}
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Akses Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {semesters.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Belum ada semester. Mulai dengan membuat semester pertama.
                </p>
                <Link href="/semester">
                  <Button className="cursor-pointer">Buat Semester</Button>
                </Link>
              </div>
            ) : (
              semesters.slice(0, 5).map((semester) => (
                <Link key={semester.id} href={`/semester/${semester.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{semester.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {semester._count.subjects} mata kuliah
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
