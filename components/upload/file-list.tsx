"use client";

import { FileText, Image, File, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import { toast } from "sonner";
import type { AttachmentData } from "@/types";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FileListProps {
  attachments: AttachmentData[];
  onDelete?: (id: string) => void;
}

export function FileList({ attachments, onDelete }: FileListProps) {
  const [imagePreview, setImagePreview] = useState<AttachmentData | null>(null);

  const isImage = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  if (attachments.length === 0) return null;

  const parseTags = (raw?: string | null) => {
    if (!raw) return [];
    return raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  };

  const getFileTypeLabel = (fileName: string, fileType: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    const extensionMap: Record<string, string> = {
      jpeg: "JPG",
      jpg: "JPG",
      png: "PNG",
      gif: "GIF",
      webp: "WEBP",
      svg: "SVG",
      pdf: "PDF",
      doc: "DOC",
      docx: "DOCX",
      xls: "XLS",
      xlsx: "XLSX",
      ppt: "PPT",
      pptx: "PPTX",
      txt: "TXT",
      csv: "CSV",
      zip: "ZIP",
      rar: "RAR",
      "7z": "7Z",
    };

    if (extension && extensionMap[extension]) {
      return extensionMap[extension];
    }

    if (extension) {
      return extension.toUpperCase();
    }

    const normalizedType = fileType.toLowerCase();
    const mimeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "image/jpeg": "JPG",
      "image/png": "PNG",
      "image/gif": "GIF",
      "image/webp": "WEBP",
      "image/svg+xml": "SVG",
      "application/msword": "DOC",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
      "application/vnd.ms-excel": "XLS",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
      "application/vnd.ms-powerpoint": "PPT",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
      "text/plain": "TXT",
      "text/csv": "CSV",
      "application/zip": "ZIP",
      "application/x-rar-compressed": "RAR",
      "application/x-7z-compressed": "7Z",
    };

    if (mimeMap[normalizedType]) {
      return mimeMap[normalizedType];
    }

    const subtype = normalizedType.split("/")[1]?.split(";")[0];
    if (!subtype) return "FILE";

    if (subtype.includes("wordprocessingml.document")) return "DOCX";
    if (subtype.includes("spreadsheetml.sheet")) return "XLSX";
    if (subtype.includes("presentationml.presentation")) return "PPTX";

    return subtype.split(".").pop()?.toUpperCase() || "FILE";
  };

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4 text-green-500" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-blue-500" />;
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete?.(id);
      toast.success("File berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus file");
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        {attachments.map((attachment) => {
          const typeLabel = getFileTypeLabel(attachment.fileName, attachment.fileType);

          return (
            <div
              key={attachment.id}
              className="flex items-start gap-3 p-2 rounded-md bg-muted/50 text-sm group"
            >
              {isImage(attachment.fileType) ? (
                <button
                  onClick={() => setImagePreview(attachment)}
                  className="cursor-pointer"
                  title={`View ${attachment.displayName || attachment.fileName}`}
                >
                  {getIcon(attachment.fileType)}
                </button>
              ) : (
                getIcon(attachment.fileType)
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{attachment.displayName || attachment.fileName}</p>
                {attachment.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{attachment.description}</p>
                )}
                {parseTags(attachment.tags).length > 0 && (
                  <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                    #{parseTags(attachment.tags).join(" #")}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {typeLabel} • {formatFileSize(attachment.fileSize)}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={attachment.filePath}
                  download={attachment.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Download ${attachment.displayName || attachment.fileName}`}
                  aria-label={`Download ${attachment.displayName || attachment.fileName}`}
                >
                  <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer">
                    <Download className="h-3 w-3" />
                  </Button>
                </a>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive cursor-pointer"
                    onClick={() => handleDelete(attachment.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{imagePreview?.displayName || imagePreview?.fileName}</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <div className="flex justify-center">
              <img
                src={imagePreview.filePath}
                alt={imagePreview.displayName || imagePreview.fileName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
