import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const material = await prisma.material.findUnique({
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

  if (!material) {
    return NextResponse.json({ error: "Materi tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(material);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, meetingNumber, content, pinned, tagIds } = body;

  const updateData: Record<string, unknown> = {};

  if (title !== undefined) {
    if (title !== null && typeof title !== "string") {
      return NextResponse.json({ error: "Judul tidak valid" }, { status: 400 });
    }

    const parsedTitle = typeof title === "string" ? title.trim() : "";
    updateData.title = parsedTitle || null;
  }

  if (meetingNumber !== undefined) {
    const parsedMeetingNumber = Number(meetingNumber);
    if (!Number.isInteger(parsedMeetingNumber) || parsedMeetingNumber < 1) {
      return NextResponse.json({ error: "Nomor pertemuan tidak valid" }, { status: 400 });
    }

    updateData.meetingNumber = parsedMeetingNumber;
  }

  if (content !== undefined) updateData.content = content;
  if (pinned !== undefined) updateData.pinned = pinned;

  if (tagIds !== undefined) {
    updateData.tags = {
      set: tagIds.map((tagId: string) => ({ id: tagId })),
    };
  }

  const material = await prisma.material.update({
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

  return NextResponse.json(material);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.material.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
