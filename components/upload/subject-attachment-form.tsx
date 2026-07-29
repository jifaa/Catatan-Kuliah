"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/upload/file-upload";
import type { AttachmentData } from "@/types";

interface SubjectAttachmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  onSuccess: (attachments: AttachmentData[]) => void;
}

export function SubjectAttachmentForm({
  open,
  onOpenChange,
  subjectId,
  onSuccess,
}: SubjectAttachmentFormProps) {
  const handleUploadComplete = (attachments: unknown[]) => {
    const uploadedAttachments = attachments as AttachmentData[];
    onSuccess(uploadedAttachments);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah Lampiran</DialogTitle>
          <DialogDescription>
            Upload lampiran umum untuk mata kuliah ini.
          </DialogDescription>
        </DialogHeader>

        <FileUpload
          subjectId={subjectId}
          withMetadataForm
          onUploadComplete={handleUploadComplete}
        />
      </DialogContent>
    </Dialog>
  );
}
