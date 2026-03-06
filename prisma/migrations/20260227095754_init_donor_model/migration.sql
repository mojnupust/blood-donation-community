-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "village" TEXT,
    "unionName" TEXT,
    "postOffice" TEXT,
    "upazila" TEXT,
    "district" TEXT,
    "sscType" TEXT,
    "sscInstitute" TEXT,
    "hscType" TEXT,
    "hscInstitute" TEXT,
    "degreeType" TEXT,
    "degreeInstitute" TEXT,
    "mastersType" TEXT,
    "mastersInstitute" TEXT,
    "profession" TEXT,
    "phone" TEXT NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donor_phone_key" ON "Donor"("phone");

-- CreateIndex
CREATE INDEX "Donor_bloodGroup_idx" ON "Donor"("bloodGroup");

-- CreateIndex
CREATE INDEX "Donor_village_idx" ON "Donor"("village");

-- CreateIndex
CREATE INDEX "Donor_name_idx" ON "Donor"("name");

-- CreateIndex
CREATE INDEX "Donor_phone_idx" ON "Donor"("phone");
