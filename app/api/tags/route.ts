import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, color } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nama tag wajib diisi" }, { status: 400 });
  }

  const existing = await prisma.tag.findUnique({
    where: { name: name.trim() },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const tag = await prisma.tag.create({
    data: {
      name: name.trim(),
      color: color || "#6366f1",
    },
  });

  return NextResponse.json(tag, { status: 201 });
}
