import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SQLITE_MAX_RETRIES = 3;
const SQLITE_RETRY_DELAY_MS = 120;

function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_PATTERN.test(value);
}

function isValidDay(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 7;
}

function isRetryableSqliteLockError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const message = `${error.code} ${error.message}`.toLowerCase();
    return message.includes("sqlite_busy") || message.includes("database is locked");
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("sqlite_busy") || message.includes("database is locked");
  }

  return false;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withSqliteRetry<T>(operation: () => Promise<T>): Promise<T> {
  let attempt = 0;

  while (attempt < SQLITE_MAX_RETRIES) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;

      if (!isRetryableSqliteLockError(error) || attempt >= SQLITE_MAX_RETRIES) {
        throw error;
      }

      await wait(SQLITE_RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error("Gagal memproses jadwal kuliah setelah beberapa percobaan");
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schedule = await withSqliteRetry(() =>
      prisma.classSchedule.findUnique({
        where: { id },
        include: {
          subject: {
            select: {
              id: true,
              title: true,
              semesterId: true,
              semester: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    );

    if (!schedule) {
      return NextResponse.json({ error: "Jadwal kuliah tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memuat jadwal kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingSchedule = await withSqliteRetry(() =>
      prisma.classSchedule.findUnique({
        where: { id },
        select: {
          id: true,
          startTime: true,
          endTime: true,
        },
      })
    ) as { startTime: string; endTime: string } | null;

    if (!existingSchedule) {
      return NextResponse.json({ error: "Jadwal kuliah tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();

    const {
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room,
      className,
      lecturer,
    } = body as {
      subjectId?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      room?: string | null;
      className?: string | null;
      lecturer?: string | null;
    };

    const updateData: Record<string, unknown> = {};

    if (subjectId !== undefined) {
      if (!subjectId || typeof subjectId !== "string") {
        return NextResponse.json({ error: "Mata kuliah wajib dipilih" }, { status: 400 });
      }
      updateData.subjectId = subjectId;
    }

    if (dayOfWeek !== undefined) {
      if (!isValidDay(dayOfWeek)) {
        return NextResponse.json({ error: "Hari tidak valid" }, { status: 400 });
      }
      updateData.dayOfWeek = dayOfWeek;
    }

    if (startTime !== undefined) {
      if (!isValidTime(startTime)) {
        return NextResponse.json({ error: "Format jam mulai harus HH:mm" }, { status: 400 });
      }
      updateData.startTime = startTime;
    }

    if (endTime !== undefined) {
      if (!isValidTime(endTime)) {
        return NextResponse.json({ error: "Format jam selesai harus HH:mm" }, { status: 400 });
      }
      updateData.endTime = endTime;
    }

    const nextStartTime =
      (updateData.startTime as string | undefined) ?? existingSchedule.startTime;
    const nextEndTime =
      (updateData.endTime as string | undefined) ?? existingSchedule.endTime;

    if (nextStartTime && nextEndTime && nextStartTime >= nextEndTime) {
      return NextResponse.json({ error: "Jam selesai harus setelah jam mulai" }, { status: 400 });
    }

    if (room !== undefined) {
      updateData.room = typeof room === "string" ? room.trim() || null : null;
    }

    if (className !== undefined) {
      updateData.className = typeof className === "string" ? className.trim() || null : null;
    }

    if (lecturer !== undefined) {
      updateData.lecturer = typeof lecturer === "string" ? lecturer.trim() || null : null;
    }

    const schedule = await withSqliteRetry(() =>
      prisma.classSchedule.update({
        where: { id },
        data: updateData,
        include: {
          subject: {
            select: {
              id: true,
              title: true,
              semesterId: true,
              semester: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    );

    return NextResponse.json(schedule);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Jadwal kuliah tidak ditemukan" }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memperbarui jadwal kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await withSqliteRetry(() => prisma.classSchedule.delete({ where: { id } }));
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Jadwal kuliah tidak ditemukan" }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal menghapus jadwal kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}
