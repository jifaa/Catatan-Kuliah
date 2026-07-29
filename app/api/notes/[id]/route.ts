import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { withSubjectNoteTableRetry } from "@/lib/subject-note-db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const note = await withSubjectNoteTableRetry(() =>
      prisma.subjectNote.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              id: true,
              title: true,
              semesterId: true,
              semester: { select: { id: true, name: true } },
            },
          },
        },
      })
    );

    if (!note) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memuat catatan",
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
    const body = await request.json();
    const { title, content, pinned } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (title !== null && typeof title !== "string") {
        return NextResponse.json({ error: "Judul tidak valid" }, { status: 400 });
      }

      const parsedTitle = typeof title === "string" ? title.trim() : "";
      updateData.title = parsedTitle || null;
    }

    if (content !== undefined) {
      if (typeof content !== "string") {
        return NextResponse.json({ error: "Konten tidak valid" }, { status: 400 });
      }

      updateData.content = content;
    }

    if (pinned !== undefined) {
      if (typeof pinned !== "boolean") {
        return NextResponse.json({ error: "Status pin tidak valid" }, { status: 400 });
      }

      updateData.pinned = pinned;
    }

    const note = await withSubjectNoteTableRetry(() =>
      prisma.subjectNote.update({
        where: { id },
        data: updateData,
        include: {
          subject: {
            select: {
              id: true,
              title: true,
              semesterId: true,
              semester: { select: { id: true, name: true } },
            },
          },
        },
      })
    );

    return NextResponse.json(note);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memperbarui catatan",
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
    await withSubjectNoteTableRetry(() => prisma.subjectNote.delete({ where: { id } }));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal menghapus catatan",
        details: message,
      },
      { status: 500 }
    );
  }
}
