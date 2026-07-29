"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Calendar, Paperclip } from "lucide-react";
import { TaskStatusBadge } from "./task-status-badge";
import { formatDate, isOverdue, isDueSoon, cn } from "@/lib/utils";
import type { TaskSummary, TaskStatus } from "@/types";

interface TaskCardProps {
  task: TaskSummary;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
}

export function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const overdue = task.deadline && task.status !== "DONE" && isOverdue(task.deadline);
  const dueSoon = task.deadline && task.status !== "DONE" && isDueSoon(task.deadline);

  return (
    <Card
      className={cn(
        "group hover:shadow-sm transition-all duration-200",
        overdue && "border-red-300 dark:border-red-800",
        dueSoon && !overdue && "border-yellow-300 dark:border-yellow-800"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Status checkbox */}
          <button
            onClick={() => {
              const nextStatus: Record<TaskStatus, TaskStatus> = {
                TODO: "IN_PROGRESS",
                IN_PROGRESS: "DONE",
                DONE: "TODO",
              };
              onStatusChange(nextStatus[task.status]);
            }}
            className={cn(
              "mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center cursor-pointer transition-colors",
              task.status === "DONE"
                ? "bg-green-500 border-green-500"
                : task.status === "IN_PROGRESS"
                ? "border-yellow-500 bg-yellow-500/20"
                : "border-muted-foreground/40 hover:border-primary"
            )}
          >
            {task.status === "DONE" && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "font-medium text-sm",
                  task.status === "DONE" && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" /> Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <TaskStatusBadge status={task.status} />

              {task.deadline && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    overdue ? "text-red-500" : dueSoon ? "text-yellow-600" : "text-muted-foreground"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.deadline)}
                </div>
              )}

              {task._count.attachments > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3 w-3" />
                  {task._count.attachments}
                </div>
              )}

              {task.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                  style={{
                    backgroundColor: tag.color + "20",
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
