import type { PrismaClient as PrismaClientType } from "@prisma/client"

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientType | undefined
}

// Lazy import to avoid build-time require of generated client in preview environments.
export const getPrisma = async () => {
  if (global.prisma) return global.prisma
  const { PrismaClient } = await import("@prisma/client")
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
  if (process.env.NODE_ENV !== "production") {
    global.prisma = client
  }
  return client
}
