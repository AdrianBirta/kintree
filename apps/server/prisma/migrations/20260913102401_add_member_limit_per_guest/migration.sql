-- AlterTable
ALTER TABLE "share_link_guests" ADD COLUMN     "membersAddedCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "share_links" ADD COLUMN     "maxMembersPerGuest" INTEGER;
