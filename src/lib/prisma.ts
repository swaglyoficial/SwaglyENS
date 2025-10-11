import { PrismaClient } from '@/generated/prisma'

/**
 * Cliente de Prisma para acceder a la base de datos
 * Se utiliza un singleton para evitar múltiples instancias en desarrollo
 * y optimizar las conexiones a la base de datos
 */
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
