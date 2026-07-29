"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Download, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { TagInput } from "@/components/shared/tag-input";
import { FileUpload } from "@/components/upload/file-upload";
import { FileList } from "@/components/upload/file-list";
import { Separator } from "@/components/ui/separator";
import { useAutosave } from "@/hooks/use-autosave";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MaterialDetail, TagData, AttachmentData } from "@/types";

export default function MaterialEditorPage({
  params,
}: {
  params: Promise<{
    semesterId: string;
    subjectId: string;
    materialId: string;
  }>;
}) {
  const { semesterId, subjectId, materialId } = use(params);
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<TagData[]>([]);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/materials/${materialId}`)
      .then((r) => r.json())
      .then((data: MaterialDetail) => {
        setMaterial(data);
        setTitle(data.title ?? "");
        setContent(data.content);
        setTags(data.tags);
        setAttachments(data.attachments);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  const save = useCallback(async () => {
    await fetch(`/api/materials/${materialId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || null,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        tagIds: tags.map((t) => t.id),
      }),
    });
  }, [materialId, title, content, tags]);

  const saveStatus = useAutosave(save, [title, content, tags]);

  const handleExportPDF = async () => {
    if (!material) return;

    const displayTitle = title.trim() || `Pertemuan ${material.meetingNumber}`;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");

      const editorEl = document.querySelector(".tiptap-editor .ProseMirror");
      if (!editorEl) return;

      const canvas = await html2canvas(editorEl as HTMLElement, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.text(displayTitle, 10, 15);
      pdf.addImage(imgData, "PNG", 0, 25, pdfWidth, pdfHeight);
      pdf.save(`${displayTitle}.pdf`);
      toast.success("PDF berhasil diexport");
    } catch {
      toast.error("Gagal export PDF");
    }
  };

  const handleTagChange = (newTags: TagData[]) => {
    setTags(newTags);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-12 w-full bg-muted rounded" />
        <div className="h-96 w-full bg-muted rounded" />
      </div>
    );
  }

  if (!material) {
    return <p className="text-muted-foreground">Materi tidak ditemukan.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href={`/semester/${semesterId}/matakuliah/${subjectId}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-xs text-muted-foreground">
              {material.subject.semester.name} / {material.subject.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save Status */}
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md",
              saveStatus === "saving" && "text-yellow-600",
              saveStatus === "saved" && "text-green-600",
              saveStatus === "error" && "text-red-600",
              saveStatus === "idle" && "text-muted-foreground"
            )}
          >
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Menyimpan...
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3" />
                Tersimpan
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3 w-3" />
                Gagal menyimpan
              </>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5 cursor-pointer">
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Judul (opsional)"
        className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
      />

      {/* Tags */}
      <TagInput selectedTags={tags} onChange={handleTagChange} />

      <Separator />

      {/* Editor */}
      <TiptapEditor content={content} onChange={setContent} />

      <Separator />

      {/* Attachments */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Lampiran</h3>
        <FileList attachments={attachments} onDelete={handleDeleteAttachment} />
        <FileUpload
          materialId={materialId}
          onUploadComplete={(newAttachments) => {
            setAttachments((prev) => [
              ...(newAttachments as AttachmentData[]),
              ...prev,
            ]);
          }}
        />
      </div>
    </div>
  );
}
