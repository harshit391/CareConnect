/*
  Warnings:

  - Added the required column `description` to the `Speciality` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Speciality" ADD COLUMN     "description" TEXT NOT NULL;
