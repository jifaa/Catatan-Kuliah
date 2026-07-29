import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      tags: true,
      attachments: { orderBy: { createdAt: "desc" } },
      subject: {
        select: {
          id: true,
          title: true,
          semesterId: true,
          semester: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Tugas tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, deadline, status, tagIds } = body;

  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title.trim();
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
  if (status !== undefined) updateData.status = status;

  if (tagIds !== undefined) {
    updateData.tags = {
      set: tagIds.map((tagId: string) => ({ id: tagId })),
    };
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      tags: true,
      attachments: { orderBy: { createdAt: "desc" } },
      subject: {
        select: {
          id: true,
          title: true,
          semesterId: true,
          semester: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
