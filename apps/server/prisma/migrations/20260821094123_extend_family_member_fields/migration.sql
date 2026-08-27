-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- AlterTable
ALTER TABLE "family_members" ADD COLUMN     "bloodType" "BloodType",
ADD COLUMN     "education" TEXT,
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "maidenName" TEXT,
ADD COLUMN     "occupation" TEXT;
