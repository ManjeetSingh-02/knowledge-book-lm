// internal-imports
import { env } from '../config/env.js';

// external-imports
import {
  ConversationGenerationStatus,
  PrismaClient,
  SourceStatus,
  SourceType,
  type Conversation,
  type Message,
  type MessageRole,
  type Prisma,
  type Source,
} from './generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// prisma client instance
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
});

// export prisma client and types
export {
  ConversationGenerationStatus,
  prisma,
  SourceStatus,
  SourceType,
  type Conversation,
  type Message,
  type MessageRole,
  type Prisma,
  type Source,
};
