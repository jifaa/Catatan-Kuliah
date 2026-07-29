import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSubjectNoteTableRetry } from "@/lib/subject-note-db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    const notes = await withSubjectNoteTableRetry(() =>
      prisma.subjectNote.findMany({
        where: subjectId ? { subjectId } : undefined,
        orderBy: [{ pinned: "desc" }, { order: "asc" }],
        include: {
          subject: {
            select: {
              id: true,
              title: true,
              semesterId: true,
            },
          },
        },
      })
    );

    return NextResponse.json(notes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memuat daftar catatan",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, subjectId } = body;

    if (!subjectId) {
      return NextResponse.json({ error: "Mata kuliah wajib dipilih" }, { status: 400 });
    }

    if (title !== undefined && title !== null && typeof title !== "string") {
      return NextResponse.json({ error: "Judul tidak valid" }, { status: 400 });
    }

    if (content !== undefined && typeof content !== "string") {
      return NextResponse.json({ error: "Konten tidak valid" }, { status: 400 });
    }

    const parsedTitle = typeof title === "string" ? title.trim() : "";
    const parsedContent = typeof content === "string" ? content : "";

    const maxOrder = await withSubjectNoteTableRetry(() =>
      prisma.subjectNote.aggregate({
        where: { subjectId },
        _max: { order: true },
      })
    );

    const note = await withSubjectNoteTableRetry(() =>
      prisma.subjectNote.create({
        data: {
          title: parsedTitle || null,
          content: parsedContent,
          subjectId,
          order: (maxOrder._max.order ?? -1) + 1,
        },
        include: {
          subject: {
            select: {
              id: true,
              title: true,
              semesterId: true,
            },
          },
        },
      })
    );

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal menyimpan catatan",
        details: message,
      },
      { status: 500 }
    );
  }
}
