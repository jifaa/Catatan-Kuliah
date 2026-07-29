"use client";

import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-medium",
        TASK_STATUS_COLORS[status],
        className
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
