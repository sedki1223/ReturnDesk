-- CreateEnum
CREATE TYPE "InventoryDisposition" AS ENUM ('RESTOCK', 'OPEN_BOX', 'DAMAGED', 'DISCARD');

-- AlterTable
ALTER TABLE "ReturnItem" ADD COLUMN     "disposition" "InventoryDisposition",
ADD COLUMN     "dispositionAt" TIMESTAMP(3);
