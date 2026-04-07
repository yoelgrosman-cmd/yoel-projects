import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { resolve } from "path";

function getDbPath(): string {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const filePath = url.startsWith("file:") ? url.slice(5) : url;
  if (filePath.startsWith("./") || filePath.startsWith(".\\")) {
    return resolve(process.cwd(), filePath);
  }
  return filePath;
}

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: getDbPath() });
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
