import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 30;

function parseLimit(rawLimit: string | null): number {
  const parsed = Number(rawLimit);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseLimit(searchParams.get("limit"));

    const [materials, tasks, notes] = await Promise.all([
      prisma.material.findMany({
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          meetingNumber: true,
          updatedAt: true,
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
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          updatedAt: true,
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
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          updatedAt: true,
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

    const recentActivities = [
      ...materials.map((material: any) => ({
        id: material.id,
        type: "MATERIAL" as const,
        title: material.title?.trim() || `Materi pertemuan ${material.meetingNumber}`,
        updatedAt: material.updatedAt.toISOString(),
        subject: material.subject,
      })),
      ...tasks.map((task: any) => ({
        id: task.id,
        type: "TASK" as const,
        title: task.title,
        updatedAt: task.updatedAt.toISOString(),
        subject: task.subject,
      })),
      ...notes.map((note: any) => ({
        id: note.id,
        type: "NOTE" as const,
        title: note.title?.trim() || "Catatan bebas",
        updatedAt: note.updatedAt.toISOString(),
        subject: note.subject,
      })),
    ]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);

    return NextResponse.json(recentActivities);
  } catch (error) {
    console.error("Failed to load recent activity", error);
    return NextResponse.json([]);
  }
}
