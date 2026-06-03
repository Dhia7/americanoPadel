import { Prisma } from "@prisma/client";

export function actionErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database connection failed. Set DATABASE_URL in your hosting environment.";
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return "Database tables are missing. Deploy with prisma migrate deploy (included in the build).";
    }
  }
  console.error(error);
  return "Something went wrong. Please try again.";
}
