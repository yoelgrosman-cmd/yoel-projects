import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { resolve } from "path";

function getLibsqlUrl(): string {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  if (dbUrl.startsWith("file:./")) {
    return `file:${resolve(process.cwd(), dbUrl.slice(7))}`;
  }
  if (dbUrl.startsWith("file:") && !dbUrl.startsWith("file://")) {
    return `file:${resolve(process.cwd(), dbUrl.slice(5))}`;
  }
  return dbUrl;
}

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: getLibsqlUrl() });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
