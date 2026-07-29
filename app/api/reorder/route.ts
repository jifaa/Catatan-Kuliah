import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { type, items } = body;

  if (!type || !items || !Array.isArray(items)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validTypes = ["semester", "subject", "material", "task", "note"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const updates = items.map((item: { id: string; order: number }) => {
    switch (type) {
      case "semester":
        return prisma.semester.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      case "subject":
        return prisma.subject.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      case "material":
        return prisma.material.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      case "task":
        return prisma.task.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      case "note":
        return prisma.subjectNote.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      default:
        return Promise.resolve();
    }
  });

  await Promise.all(updates);

  return NextResponse.json({ success: true });
}
