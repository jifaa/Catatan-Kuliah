import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const semester = await prisma.semester.findUnique({
    where: { id },
    include: {
      subjects: {
        orderBy: [{ pinned: "desc" }, { order: "asc" }],
        include: {
          _count: {
            select: { materials: true, tasks: true },
          },
          tasks: {
            select: { status: true },
          },
        },
      },
    },
  });

  if (!semester) {
    return NextResponse.json({ error: "Semester tidak ditemukan" }, { status: 404 });
  }

  const result = {
    ...semester,
    subjects: semester.subjects.map((s: typeof semester.subjects[number]) => ({
      ...s,
      tasks: undefined,
      taskStats: {
        total: s.tasks.length,
        done: s.tasks.filter((t: { status: string }) => t.status === "DONE").length,
      },
    })),
  };

  return NextResponse.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, startDate, endDate } = body;

  const semester = await prisma.semester.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
    },
    include: {
      _count: { select: { subjects: true } },
    },
  });

  return NextResponse.json(semester);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.semester.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
