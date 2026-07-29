import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (subjectId) where.subjectId = subjectId;
  if (status) where.status = status;
  if (from || to) {
    where.deadline = {};
    if (from) where.deadline.gte = new Date(from);
    if (to) where.deadline.lte = new Date(to);
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      tags: true,
      _count: { select: { attachments: true } },
      subject: {
        select: {
          id: true,
          title: true,
          semesterId: true,
        },
      },
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, deadline, status, subjectId, tagIds } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "Judul tugas wajib diisi" }, { status: 400 });
  }

  if (!subjectId) {
    return NextResponse.json({ error: "Mata kuliah wajib dipilih" }, { status: 400 });
  }

  const maxOrder = await prisma.task.aggregate({
    where: { subjectId },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      status: status || "TODO",
      subjectId,
      order: (maxOrder._max.order ?? -1) + 1,
      ...(tagIds && tagIds.length > 0 && {
        tags: { connect: tagIds.map((id: string) => ({ id })) },
      }),
    },
    include: {
      tags: true,
      _count: { select: { attachments: true } },
      subject: {
        select: {
          id: true,
          title: true,
          semesterId: true,
        },
      },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
