"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatFileSize } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  materialId?: string;
  taskId?: string;
  subjectId?: string;
  withMetadataForm?: boolean;
  onUploadComplete: (attachments: unknown[]) => void;
  className?: string;
}

export function FileUpload({
  materialId,
  taskId,
  subjectId,
  withMetadataForm = false,
  onUploadComplete,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const oversized = acceptedFiles.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} file melebihi batas 10MB`);
      return;
    }
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    if (withMetadataForm && !displayName.trim()) {
      toast.error("Nama lampiran wajib diisi");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (materialId) formData.append("materialId", materialId);
      if (taskId) formData.append("taskId", taskId);
      if (subjectId) formData.append("subjectId", subjectId);
      if (displayName.trim()) formData.append("displayName", displayName.trim());
      if (description.trim()) formData.append("description", description.trim());
      if (tagsInput.trim()) formData.append("tags", tagsInput.trim());

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload gagal");
      }

      const attachments = await res.json();
      onUploadComplete(attachments);
      setFiles([]);
      setDisplayName("");
      setDescription("");
      setTagsInput("");
      toast.success(`${attachments.length} file berhasil diupload`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4 text-green-500" />;
    if (type.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    return <File className="h-4 w-4 text-blue-500" />;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {withMetadataForm && (
        <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/20">
          <div className="space-y-1.5">
            <Label htmlFor="attachment-name">Nama Lampiran</Label>
            <Input
              id="attachment-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Contoh: Ringkasan UTS"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attachment-description">Deskripsi</Label>
            <Textarea
              id="attachment-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat isi lampiran"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attachment-tags">Tag</Label>
            <Input
              id="attachment-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Pisahkan dengan koma, contoh: uts, ringkasan, pdf"
            />
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Lepaskan file di sini..."
            : "Drag & drop file di sini, atau klik untuk memilih"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          PDF, DOCX, PPT, gambar, dll. Maks 10MB per file
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-2 rounded-md bg-muted/50 text-sm"
            >
              {getIcon(file.type)}
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatFileSize(file.size)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 cursor-pointer"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            onClick={uploadFiles}
            disabled={uploading}
            size="sm"
            className="cursor-pointer"
          >
            {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Upload {files.length} File
          </Button>
        </div>
      )}
    </div>
  );
}
