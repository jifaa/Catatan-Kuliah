import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const materialId = formData.get("materialId") as string | null;
  const taskId = formData.get("taskId") as string | null;
  const subjectId = formData.get("subjectId") as string | null;
  const displayName = (formData.get("displayName") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() || null;
  const tagsRaw = (formData.get("tags") as string | null) ?? "";

  const tags = tagsRaw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(",");

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
  }

  const ownerCount = [materialId, taskId, subjectId].filter(Boolean).length;
  if (ownerCount !== 1) {
    return NextResponse.json(
      { error: "File harus terikat ke satu konteks: materi, tugas, atau mata kuliah" },
      { status: 400 }
    );
  }

  if (subjectId) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return NextResponse.json({ error: "Mata kuliah tidak ditemukan" }, { status: 404 });
    }

    if (!displayName) {
      return NextResponse.json(
        { error: "Nama lampiran wajib diisi untuk upload di mata kuliah" },
        { status: 400 }
      );
    }
  }

  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });

  const attachments = [];

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: `File ${file.name} terlalu besar (maks 10MB)` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        filePath: `/api/uploads/${uniqueName}`,
        fileSize: file.size,
        fileType: file.type,
        displayName,
        description,
        tags: tags || null,
        materialId: materialId || null,
        taskId: taskId || null,
        subjectId: subjectId || null,
      },
    });

    attachments.push(attachment);
  }

  return NextResponse.json(attachments, { status: 201 });
}
