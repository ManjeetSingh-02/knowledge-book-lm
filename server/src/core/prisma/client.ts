// internal-imports
import { env } from '../config/env.js';

// external-imports
import { PrismaClient } from './generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// prisma client instance
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

// export prisma client and types
export { prisma };
