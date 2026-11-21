/*
  Warnings:

  - You are about to drop the column `generationStatus` on the `conversation` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'ERROR');

-- AlterTable
ALTER TABLE "conversation" DROP COLUMN "generationStatus",
ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "ConversationGenerationStatus";
