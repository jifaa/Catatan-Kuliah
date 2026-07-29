import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

// Use libsql (Turso) when TURSO_AUTH_TOKEN is set, otherwise fall back to local SQLite
const adapter = process.env.TURSO_AUTH_TOKEN
  ? new PrismaLibSql({
      url: DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  : new PrismaBetterSqlite3({
      url: DATABASE_URL,
    });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma = globalForPrisma.prisma ?? new (PrismaClient as any)({
  adapter,
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
