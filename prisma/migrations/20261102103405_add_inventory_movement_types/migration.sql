/*
  Warnings:

  - Added the required column `type` to the `InventoryMovement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('OPENING_STOCK', 'RETURN', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "note" TEXT,
ADD COLUMN     "type" "InventoryMovementType" NOT NULL,
ALTER COLUMN "returnItemId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "InventoryMovement_type_createdAt_idx" ON "InventoryMovement"("type", "createdAt");
