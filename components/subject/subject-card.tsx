"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Pin, PinOff, FileText, ClipboardList } from "lucide-react";
import { ProgressBar } from "@/components/shared/progress-bar";
import { cn } from "@/lib/utils";
import type { SubjectWithCounts } from "@/types";

interface SubjectCardProps {
  subject: SubjectWithCounts;
  semesterId: string;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function SubjectCard({
  subject,
  semesterId,
  onEdit,
  onDelete,
  onTogglePin,
}: SubjectCardProps) {
  const progress =
    subject.taskStats && subject.taskStats.total > 0
      ? (subject.taskStats.done / subject.taskStats.total) * 100
      : 0;

  return (
    <Link href={`/semester/${semesterId}/matakuliah/${subject.id}`}>
      <Card
        className={cn(
          "group hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer",
          subject.pinned && "border-primary/30 bg-primary/[0.02]"
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {subject.pinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
              <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors truncate">
                {subject.title}
              </CardTitle>
            </div>
            {subject.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {subject.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                onClick={(e) => e.preventDefault()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); onTogglePin(); }}
                className="cursor-pointer"
              >
                {subject.pinned ? (
                  <><PinOff className="h-4 w-4 mr-2" /> Unpin</>
                ) : (
                  <><Pin className="h-4 w-4 mr-2" /> Pin</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); onEdit(); }}
                className="cursor-pointer"
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); onDelete(); }}
                className="text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>{subject._count.materials} Materi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              <span>{subject._count.tasks} Tugas</span>
            </div>
          </div>
          {subject.taskStats && subject.taskStats.total > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress Tugas</span>
                <span>
                  {subject.taskStats.done}/{subject.taskStats.total}
                </span>
              </div>
              <ProgressBar value={progress} showLabel={false} size="sm" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
