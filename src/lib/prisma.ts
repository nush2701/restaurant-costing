import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Uses the datasource configured in schema.prisma:
//   url       = DATABASE_URL  (pooled connection, e.g. Supabase PgBouncer) for the app
//   directUrl = DIRECT_URL    (direct connection) for migrations
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;