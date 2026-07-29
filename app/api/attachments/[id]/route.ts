import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
  });

  if (!attachment) {
    return NextResponse.json({ error: "Attachment tidak ditemukan" }, { status: 404 });
  }

  // Delete file from disk
  try {
    const filename = attachment.filePath.split("/").pop();
    if (filename) {
      const filePath = path.join(process.cwd(), "uploads", filename);
      await unlink(filePath);
    }
  } catch {
    // File may already be deleted, continue
  }

  await prisma.attachment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
