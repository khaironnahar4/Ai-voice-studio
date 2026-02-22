import { PrismaClient } from '@/prisma/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import dotenv from 'dotenv'

dotenv.config()
const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const adapter = new PrismaNeon({ connectionString })

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma