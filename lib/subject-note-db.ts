import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const SQLITE_LOCK_MAX_ATTEMPTS = 5;
const SQLITE_LOCK_BASE_DELAY_MS = 20;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isSqliteDatabaseLocked(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes("database is locked");
}

export function isMissingSubjectNoteTable(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function ensureSubjectNoteTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SubjectNote" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT,
      "content" TEXT NOT NULL DEFAULT '',
      "subjectId" TEXT NOT NULL,
      "pinned" BOOLEAN NOT NULL DEFAULT false,
      "order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "SubjectNote_subjectId_fkey"
        FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
}

async function retryOnSqliteLock<T extends Promise<unknown>>(
  operation: () => T
): Promise<Awaited<T>> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= SQLITE_LOCK_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isSqliteDatabaseLocked(error)) {
        throw error;
      }

      lastError = error;

      if (attempt < SQLITE_LOCK_MAX_ATTEMPTS) {
        const delayMs = SQLITE_LOCK_BASE_DELAY_MS * attempt;
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

export async function withSubjectNoteTableRetry<T extends Promise<unknown>>(
  operation: () => T
): Promise<Awaited<T>> {
  try {
    return await retryOnSqliteLock(operation);
  } catch (error) {
    if (!isMissingSubjectNoteTable(error)) {
      throw error;
    }

    await ensureSubjectNoteTable();
    return retryOnSqliteLock(operation);
  }
}
