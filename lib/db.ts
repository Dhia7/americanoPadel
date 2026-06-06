import { PrismaClient } from "@prisma/client";

const RETRY_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 400;

function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("can't reach database server") ||
    msg.includes("connection timed out") ||
    msg.includes("econnrefused") ||
    msg.includes("connection reset")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        let lastError: unknown;
        for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
          try {
            return await query(args);
          } catch (error) {
            lastError = error;
            if (!isTransientDbError(error) || attempt === RETRY_ATTEMPTS) {
              throw error;
            }
            await sleep(RETRY_BASE_DELAY_MS * attempt);
          }
        }
        throw lastError;
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
