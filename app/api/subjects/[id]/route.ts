import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        semester: { select: { id: true, name: true } },
        materials: {
          orderBy: [{ pinned: "desc" }, { order: "asc" }],
          include: {
            tags: true,
            _count: { select: { attachments: true } },
          },
        },
        tasks: {
          orderBy: { order: "asc" },
          include: {
            tags: true,
            _count: { select: { attachments: true } },
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Mata kuliah tidak ditemukan" }, { status: 404 });
    }

    let attachments: {
      id: string;
      fileName: string;
      filePath: string;
      fileSize: number;
      fileType: string;
      displayName: string | null;
      description: string | null;
      tags: string | null;
      createdAt: Date;
    }[] = [];
    let notes: {
      id: string;
      title: string | null;
      content: string;
      subjectId: string;
      pinned: boolean;
      order: number;
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    try {
      notes = await prisma.subjectNote.findMany({
        where: { subjectId: id },
        orderBy: [{ pinned: "desc" }, { order: "asc" }],
      });
    } catch (notesError) {
      // Fallback for environments where SubjectNote migration is not applied yet.
      if (!(notesError instanceof Prisma.PrismaClientKnownRequestError && notesError.code === "P2021")) {
        console.error("Failed to load subject notes", notesError);
      }
    }

    try {
      attachments = await prisma.attachment.findMany({
        where: {
          subjectId: id,
          materialId: null,
          taskId: null,
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (attachmentError) {
      console.error("Failed to load subject attachments", attachmentError);
    }

    return NextResponse.json({
      ...subject,
      notes,
      attachments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memuat detail mata kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => null)) as {
      title?: string;
      description?: string | null;
      pinned?: boolean;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const { title, description, pinned } = body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(pinned !== undefined && { pinned }),
      },
      include: {
        _count: { select: { materials: true, tasks: true } },
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Mata kuliah tidak ditemukan" }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memperbarui mata kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Mata kuliah tidak ditemukan" }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal menghapus mata kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}
