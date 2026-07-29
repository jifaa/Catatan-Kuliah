import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

  const materials = await prisma.material.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: [{ pinned: "desc" }, { order: "asc" }],
    include: {
      tags: true,
      _count: { select: { attachments: true } },
    },
  });

  return NextResponse.json(materials);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, meetingNumber, content, subjectId, tagIds } = body;

  if (!subjectId) {
    return NextResponse.json({ error: "Mata kuliah wajib dipilih" }, { status: 400 });
  }

  const parsedMeetingNumber = Number(meetingNumber);
  if (!Number.isInteger(parsedMeetingNumber) || parsedMeetingNumber < 1) {
    return NextResponse.json({ error: "Nomor pertemuan wajib diisi" }, { status: 400 });
  }

  const parsedTitle = typeof title === "string" ? title.trim() : "";

  const maxOrder = await prisma.material.aggregate({
    where: { subjectId },
    _max: { order: true },
  });

  const material = await prisma.material.create({
    data: {
      title: parsedTitle || null,
      meetingNumber: parsedMeetingNumber,
      content: content || "",
      subjectId,
      order: (maxOrder._max.order ?? -1) + 1,
      ...(tagIds && tagIds.length > 0 && {
        tags: { connect: tagIds.map((id: string) => ({ id })) },
      }),
    },
    include: {
      tags: true,
      attachments: true,
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

  return NextResponse.json(material, { status: 201 });
}
