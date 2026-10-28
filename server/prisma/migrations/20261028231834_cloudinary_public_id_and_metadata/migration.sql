/*
  Warnings:

  - You are about to drop the column `metadata` on the `source` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `source` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "source" DROP COLUMN "metadata",
DROP COLUMN "url",
ADD COLUMN     "cloudinaryPublicId" TEXT;
