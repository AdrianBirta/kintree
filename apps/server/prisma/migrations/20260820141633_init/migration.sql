-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('MARRIED', 'DIVORCED', 'PARTNER', 'WIDOWED');

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender",
    "birthDate" TIMESTAMP(3),
    "deathDate" TIMESTAMP(3),
    "bio" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_child" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,

    CONSTRAINT "parent_child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnerships" (
    "id" TEXT NOT NULL,
    "partnerAId" TEXT NOT NULL,
    "partnerBId" TEXT NOT NULL,
    "status" "PartnershipStatus" NOT NULL DEFAULT 'MARRIED',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),

    CONSTRAINT "partnerships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_child_parentId_childId_key" ON "parent_child"("parentId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "partnerships_partnerAId_partnerBId_key" ON "partnerships"("partnerAId", "partnerBId");

-- AddForeignKey
ALTER TABLE "parent_child" ADD CONSTRAINT "parent_child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_child" ADD CONSTRAINT "parent_child_childId_fkey" FOREIGN KEY ("childId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_partnerAId_fkey" FOREIGN KEY ("partnerAId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_partnerBId_fkey" FOREIGN KEY ("partnerBId") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
