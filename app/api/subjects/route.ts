import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const semesterId = searchParams.get("semesterId");

  const subjects = await prisma.subject.findMany({
    where: semesterId ? { semesterId } : undefined,
    orderBy: [{ pinned: "desc" }, { order: "asc" }],
    include: {
      _count: {
        select: { materials: true, tasks: true },
      },
    },
  });

  return NextResponse.json(subjects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, semesterId } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Judul mata kuliah wajib diisi" }, { status: 400 });
  }

  if (!semesterId) {
    return NextResponse.json({ error: "Semester wajib dipilih" }, { status: 400 });
  }

  const maxOrder = await prisma.subject.aggregate({
    where: { semesterId },
    _max: { order: true },
  });

  const subject = await prisma.subject.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      semesterId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    include: {
      _count: { select: { materials: true, tasks: true } },
    },
  });

  return NextResponse.json(subject, { status: 201 });
}
