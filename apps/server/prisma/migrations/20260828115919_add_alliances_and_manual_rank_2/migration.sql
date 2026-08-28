-- CreateEnum
CREATE TYPE "AllianceType" AS ENUM ('CUSCRI');

-- AlterTable
ALTER TABLE "family_members" ADD COLUMN     "manualRank" INTEGER;

-- CreateTable
CREATE TABLE "family_alliances" (
    "id" TEXT NOT NULL,
    "memberAId" TEXT NOT NULL,
    "memberBId" TEXT NOT NULL,
    "type" "AllianceType" NOT NULL DEFAULT 'CUSCRI',
    "viaPartnershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_alliances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_alliances_memberAId_memberBId_key" ON "family_alliances"("memberAId", "memberBId");

-- AddForeignKey
ALTER TABLE "family_alliances" ADD CONSTRAINT "family_alliances_memberAId_fkey" FOREIGN KEY ("memberAId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_alliances" ADD CONSTRAINT "family_alliances_memberBId_fkey" FOREIGN KEY ("memberBId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
