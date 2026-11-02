-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RECEIVED', 'INSPECTING', 'REFUND_PENDING', 'REFUNDED', 'EXCHANGED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DEFECTIVE', 'WRONG_ITEM', 'DAMAGED', 'NOT_AS_DESCRIBED', 'WRONG_SIZE', 'CHANGED_MIND', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('UNINSPECTED', 'NEW', 'OPENED', 'DAMAGED', 'DEFECTIVE');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('REFUND', 'EXCHANGE', 'STORE_CREDIT');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" "ReturnReason" NOT NULL,
    "description" TEXT,
    "resolution" "ResolutionType",
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" "ItemCondition" NOT NULL DEFAULT 'UNINSPECTED',
    "notes" TEXT,
    "returnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnId" TEXT NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_storeId_email_key" ON "Customer"("storeId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "Product"("storeId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnRequest_reference_key" ON "ReturnRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_returnId_key" ON "Refund"("returnId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnItem" ADD CONSTRAINT "ReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "ReturnRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
