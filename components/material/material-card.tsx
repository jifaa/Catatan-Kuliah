"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pin, PinOff, Paperclip } from "lucide-react";
import { formatRelative, cn } from "@/lib/utils";
import type { MaterialSummary } from "@/types";

interface MaterialCardProps {
  material: MaterialSummary;
  href: string;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function MaterialCard({ material, href, onDelete, onTogglePin }: MaterialCardProps) {
  const meetingLabel = `Pertemuan ${material.meetingNumber}`;
  const displayTitle = material.title?.trim() || "Tanpa judul";

  return (
    <Link href={href}>
      <Card
        className={cn(
          "group hover:shadow-sm hover:border-primary/20 transition-all duration-200 cursor-pointer",
          material.pinned && "border-primary/30 bg-primary/2"
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{meetingLabel}</p>
              <div className="mt-0.5 flex items-center gap-2">
                {material.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                <p className="font-medium text-sm truncate">{displayTitle}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelative(material.updatedAt)}
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
                  onClick={(e) => { e.preventDefault(); onTogglePin(); }}
                  className="cursor-pointer"
                >
                  {material.pinned ? (
                    <><PinOff className="h-4 w-4 mr-2" /> Unpin</>
                  ) : (
                    <><Pin className="h-4 w-4 mr-2" /> Pin</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); onDelete(); }}
                  className="text-destructive cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 mt-2">
            {material._count.attachments > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                {material._count.attachments}
              </div>
            )}
            {material.tags.map((tag) => (
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
        </CardContent>
      </Card>
    </Link>
  );
}
