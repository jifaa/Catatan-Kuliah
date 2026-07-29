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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get("semesterId");
    const subjectId = searchParams.get("subjectId");

    const schedules = await withSqliteRetry(() =>
      prisma.classSchedule.findMany({
      where: {
        ...(subjectId ? { subjectId } : {}),
        ...(semesterId
          ? {
              subject: {
                semesterId,
              },
            }
          : {}),
      },
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
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, { order: "asc" }],
    })
    );

    return NextResponse.json(schedules);
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

export async function POST(request: NextRequest) {
  try {
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

    if (!subjectId || typeof subjectId !== "string") {
      return NextResponse.json({ error: "Mata kuliah wajib dipilih" }, { status: 400 });
    }

    if (!isValidDay(dayOfWeek)) {
      return NextResponse.json({ error: "Hari tidak valid" }, { status: 400 });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return NextResponse.json({ error: "Format jam harus HH:mm" }, { status: 400 });
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: "Jam selesai harus setelah jam mulai" }, { status: 400 });
    }

    const maxOrder = await withSqliteRetry(() =>
      prisma.classSchedule.aggregate({
        where: { subjectId, dayOfWeek },
        _max: { order: true },
      })
    ) as { _max: { order: number | null } };

    const schedule = await withSqliteRetry(() =>
      prisma.classSchedule.create({
        data: {
          subjectId,
          dayOfWeek,
          startTime,
          endTime,
          room: typeof room === "string" ? room.trim() || null : null,
          className: typeof className === "string" ? className.trim() || null : null,
          lecturer: typeof lecturer === "string" ? lecturer.trim() || null : null,
          order: (maxOrder._max.order ?? -1) + 1,
        },
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

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal menambahkan jadwal kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}
