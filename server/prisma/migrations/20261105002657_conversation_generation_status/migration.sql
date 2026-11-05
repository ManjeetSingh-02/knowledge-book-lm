-- CreateEnum
CREATE TYPE "ConversationGenerationStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "conversation" ADD COLUMN     "generationStatus" "ConversationGenerationStatus" NOT NULL DEFAULT 'PENDING';
