/*
  Warnings:

  - A unique constraint covering the columns `[selfMemberId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "selfMemberId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_selfMemberId_key" ON "users"("selfMemberId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_selfMemberId_fkey" FOREIGN KEY ("selfMemberId") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
