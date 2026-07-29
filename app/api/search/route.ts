import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json({ materials: [], tasks: [], notes: [] });
  }

  const query = q.trim();

  const [materials, tasks, notes] = await Promise.all([
    prisma.material.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
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
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
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
    }),
    prisma.subjectNote.findMany({
      where: {
        OR: [{ title: { contains: query } }, { content: { contains: query } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        subject: {
          select: {
            id: true,
            title: true,
            semesterId: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({ materials, tasks, notes });
}
