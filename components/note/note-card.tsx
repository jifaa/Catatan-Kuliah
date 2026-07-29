"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pin, PinOff, FilePenLine, Pencil } from "lucide-react";
import { formatRelative, cn } from "@/lib/utils";
import type { SubjectNoteSummary } from "@/types";

interface NoteCardProps {
  note: SubjectNoteSummary;
  href: string;
  onDelete: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
}

export function NoteCard({ note, href, onDelete, onTogglePin, onEdit }: NoteCardProps) {
  const displayTitle = note.title?.trim() || "Catatan bebas";

  return (
    <Link href={href}>
      <Card
        className={cn(
          "group hover:shadow-sm hover:border-primary/20 transition-all duration-200 cursor-pointer",
          note.pinned && "border-primary/30 bg-primary/2"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="mt-0.5 flex items-center gap-2">
                <FilePenLine className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {note.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                <p className="font-medium text-sm truncate">{displayTitle}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelative(note.updatedAt)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit();
                  }}
                  className="cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2" /> Edit Judul
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onTogglePin();
                  }}
                  className="cursor-pointer"
                >
                  {note.pinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" /> Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" /> Pin
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete();
                  }}
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
