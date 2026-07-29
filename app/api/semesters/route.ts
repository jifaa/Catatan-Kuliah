import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SQLITE_LOCK_MAX_ATTEMPTS = 4;

function isSqliteDatabaseLocked(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes("database is locked");
}

async function withSqliteRetry<T>(operation: () => T): Promise<Awaited<T>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= SQLITE_LOCK_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isSqliteDatabaseLocked(error) || attempt === SQLITE_LOCK_MAX_ATTEMPTS) {
        throw error;
      }

      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 25));
    }
  }

  throw lastError;
}

// Helper function to extract numeric value from semester name for sorting
function extractSemesterNumber(name: string): number {
  const match = name.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

// Helper function to sort semesters by numeric value in name
function sortSemestersByNumber<T extends { name: string }>(semesters: T[]): T[] {
  return semesters.sort((a, b) => {
    const numA = extractSemesterNumber(a.name);
    const numB = extractSemesterNumber(b.name);
    return numA - numB; // Sort from small to large
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get("include");

    if (include === "subjects") {
      const semesters = await withSqliteRetry(() =>
        prisma.semester.findMany({
          include: {
            subjects: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                semesterId: true,
              },
            },
          },
        })
      );
      return NextResponse.json(sortSemestersByNumber(semesters));
    }

    const semesters = await withSqliteRetry(() =>
      prisma.semester.findMany({
        include: {
          _count: {
            select: { subjects: true },
          },
        },
      })
    );

    return NextResponse.json(sortSemestersByNumber(semesters));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal memuat semester dan mata kuliah",
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, startDate, endDate } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama semester wajib diisi" }, { status: 400 });
    }

    const maxOrder = await withSqliteRetry(() => prisma.semester.aggregate({ _max: { order: true } }));

    const semester = await withSqliteRetry(() =>
      prisma.semester.create({
        data: {
          name: name.trim(),
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          order: (maxOrder._max.order ?? -1) + 1,
        },
        include: {
          _count: { select: { subjects: true } },
        },
      })
    );

    return NextResponse.json(semester, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json(
      {
        error: "Gagal menyimpan semester",
        details: message,
      },
      { status: 500 }
    );
  }
}
