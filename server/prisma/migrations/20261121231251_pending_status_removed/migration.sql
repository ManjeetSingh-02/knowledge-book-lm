/*
  Warnings:

  - The values [PENDING] on the enum `ConversationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ConversationStatus_new" AS ENUM ('GENERATING', 'READY', 'ERROR');
ALTER TABLE "public"."conversation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "conversation" ALTER COLUMN "status" TYPE "ConversationStatus_new" USING ("status"::text::"ConversationStatus_new");
ALTER TYPE "ConversationStatus" RENAME TO "ConversationStatus_old";
ALTER TYPE "ConversationStatus_new" RENAME TO "ConversationStatus";
DROP TYPE "public"."ConversationStatus_old";
ALTER TABLE "conversation" ALTER COLUMN "status" SET DEFAULT 'READY';
COMMIT;

-- AlterTable
ALTER TABLE "conversation" ALTER COLUMN "status" SET DEFAULT 'READY';
