-- CreateTable
CREATE TABLE "ProductInventory" (
    "id" TEXT NOT NULL,
    "sellableQuantity" INTEGER NOT NULL DEFAULT 0,
    "openBoxQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "discardedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "disposition" "InventoryDisposition" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    "returnItemId" TEXT NOT NULL,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductInventory_productId_key" ON "ProductInventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_returnItemId_key" ON "InventoryMovement"("returnItemId");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_createdAt_idx" ON "InventoryMovement"("productId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_returnItemId_fkey" FOREIGN KEY ("returnItemId") REFERENCES "ReturnItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
