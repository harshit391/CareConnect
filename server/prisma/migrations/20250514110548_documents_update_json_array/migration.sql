/*
  Warnings:

  - The `documents` column on the `Hospital` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Hospital" DROP COLUMN "documents",
ADD COLUMN     "documents" JSONB[];
