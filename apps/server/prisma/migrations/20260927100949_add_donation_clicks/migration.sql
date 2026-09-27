-- CreateTable
CREATE TABLE "donation_clicks" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donation_clicks_pkey" PRIMARY KEY ("id")
);
