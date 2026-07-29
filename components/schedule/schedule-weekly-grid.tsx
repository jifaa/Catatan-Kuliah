"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassScheduleData } from "@/types";

interface ScheduleWeeklyGridProps {
  schedules: ClassScheduleData[];
  onEdit: (schedule: ClassScheduleData) => void;
  onDelete: (scheduleId: string) => void;
}

const DAY_CONFIG = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

export function ScheduleWeeklyGrid({ schedules, onEdit, onDelete }: ScheduleWeeklyGridProps) {
  const safeSchedules = Array.isArray(schedules) ? schedules : [];

  const groupedByDay = DAY_CONFIG.map((day) => ({
    ...day,
    items: safeSchedules.filter((item) => item.dayOfWeek === day.value),
  }));

  return (
    <div className="space-y-4">
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-4">
        {groupedByDay.map((day) => (
          <Card key={day.value} className="min-h-55">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{day.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {day.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tidak ada jadwal</p>
              ) : (
                day.items.map((schedule) => (
                  <div key={schedule.id} className="rounded-md border border-border p-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs cursor-pointer"
                          onClick={() => onEdit(schedule)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs text-destructive cursor-pointer"
                          onClick={() => onDelete(schedule.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-medium leading-tight">{schedule.subject?.title}</p>
                    {schedule.room ? (
                      <p className="text-xs text-muted-foreground leading-tight">{schedule.room}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {schedule.className ? <Badge variant="secondary">{schedule.className}</Badge> : null}
                    </div>
                    {schedule.lecturer ? (
                      <p className="text-xs text-muted-foreground leading-tight">{schedule.lecturer}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {groupedByDay.map((day) => (
          <Card key={day.value}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{day.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {day.items.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tidak ada jadwal</p>
              ) : (
                day.items.map((schedule) => (
                  <div key={schedule.id} className="rounded-md border border-border p-2 space-y-1.5">
                    <p className="text-xs font-medium">
                      {schedule.startTime} - {schedule.endTime}
                    </p>
                    <p className="text-sm font-medium leading-tight">{schedule.subject?.title}</p>
                    {schedule.room ? (
                      <p className="text-xs text-muted-foreground leading-tight">{schedule.room}</p>
                    ) : null}
                    {schedule.className ? <Badge variant="secondary">{schedule.className}</Badge> : null}
                    {schedule.lecturer ? (
                      <p className="text-xs text-muted-foreground leading-tight">{schedule.lecturer}</p>
                    ) : null}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs cursor-pointer"
                        onClick={() => onEdit(schedule)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-destructive cursor-pointer"
                        onClick={() => onDelete(schedule.id)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
