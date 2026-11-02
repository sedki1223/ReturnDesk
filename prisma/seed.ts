
import {
  PrismaClient,
  ReturnStatus,
  ReturnReason,
  ItemCondition,
  RefundStatus,
  ResolutionType,
  InventoryDisposition,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const openingStock = [
  {
    sellableQuantity: 120,
    openBoxQuantity: 8,
    damagedQuantity: 3,
    discardedQuantity: 2,
  },
  {
    sellableQuantity: 75,
    openBoxQuantity: 5,
    damagedQuantity: 2,
    discardedQuantity: 1,
  },
  {
    sellableQuantity: 95,
    openBoxQuantity: 7,
    damagedQuantity: 2,
    discardedQuantity: 1,
  },
  {
    sellableQuantity: 60,
    openBoxQuantity: 4,
    damagedQuantity: 1,
    discardedQuantity: 1,
  },
  {
    sellableQuantity: 110,
    openBoxQuantity: 6,
    damagedQuantity: 2,
    discardedQuantity: 1,
  },
];

async function main() {
  await prisma.inventoryMovement.deleteMany();
  await prisma.productInventory.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.store.deleteMany();

  const store = await prisma.store.create({
    data: {
      name: "Northstar Commerce",
      email: "support@northstar.example",
    },
  });

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "Olivia Martin",
        email: "olivia.martin@example.com",
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "James Wilson",
        email: "james.wilson@example.com",
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Sophia Chen",
        email: "sophia.chen@example.com",
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Noah Thompson",
        email: "noah.thompson@example.com",
        storeId: store.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: "Emma Davis",
        email: "emma.davis@example.com",
        storeId: store.id,
      },
    }),
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Wireless Headphones",
        sku: "WH-100",
        price: 129.99,
        storeId: store.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Smart Watch Pro",
        sku: "SW-200",
        price: 249.99,
        storeId: store.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mechanical Keyboard",
        sku: "MK-300",
        price: 89.5,
        storeId: store.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "USB-C Docking Station",
        sku: "DK-400",
        price: 159.0,
        storeId: store.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Portable SSD 1TB",
        sku: "SSD-500",
        price: 119.0,
        storeId: store.id,
      },
    }),
  ]);

  const stockBuckets = [
    {
      field: "sellableQuantity",
      disposition: InventoryDisposition.RESTOCK,
    },
    {
      field: "openBoxQuantity",
      disposition: InventoryDisposition.OPEN_BOX,
    },
    {
      field: "damagedQuantity",
      disposition: InventoryDisposition.DAMAGED,
    },
    {
      field: "discardedQuantity",
      disposition: InventoryDisposition.DISCARD,
    },
  ] as const;

  for (const [index, product] of products.entries()) {
    const quantities = openingStock[index];

    await prisma.productInventory.create({
      data: {
        productId: product.id,
        ...quantities,
      },
    });

    for (const bucket of stockBuckets) {
      const quantity = quantities[bucket.field];

      if (quantity <= 0) continue;

      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: "OPENING_STOCK",
          disposition: bucket.disposition,
          quantity,
          note: "Initial demo inventory balance.",
        },
      });
    }
  }

  const returnData = [
    {
      customer: 0,
      product: 0,
      status: ReturnStatus.REQUESTED,
      reason: ReturnReason.DEFECTIVE,
      condition: ItemCondition.UNINSPECTED,
      resolution: ResolutionType.REFUND,
    },
    {
      customer: 1,
      product: 1,
      status: ReturnStatus.UNDER_REVIEW,
      reason: ReturnReason.WRONG_SIZE,
      condition: ItemCondition.UNINSPECTED,
      resolution: ResolutionType.EXCHANGE,
    },
    {
      customer: 2,
      product: 2,
      status: ReturnStatus.APPROVED,
      reason: ReturnReason.CHANGED_MIND,
      condition: ItemCondition.UNINSPECTED,
      resolution: ResolutionType.REFUND,
    },
    {
      customer: 3,
      product: 3,
      status: ReturnStatus.RECEIVED,
      reason: ReturnReason.DAMAGED,
      condition: ItemCondition.OPENED,
      resolution: ResolutionType.REFUND,
    },
    {
      customer: 4,
      product: 4,
      status: ReturnStatus.INSPECTING,
      reason: ReturnReason.NOT_AS_DESCRIBED,
      condition: ItemCondition.DAMAGED,
      resolution: ResolutionType.STORE_CREDIT,
    },
    {
      customer: 0,
      product: 1,
      status: ReturnStatus.REFUNDED,
      reason: ReturnReason.WRONG_ITEM,
      condition: ItemCondition.NEW,
      resolution: ResolutionType.REFUND,
    },
    {
      customer: 1,
      product: 2,
      status: ReturnStatus.REJECTED,
      reason: ReturnReason.CHANGED_MIND,
      condition: ItemCondition.DAMAGED,
      resolution: ResolutionType.REFUND,
    },
    {
      customer: 2,
      product: 4,
      status: ReturnStatus.REFUND_PENDING,
      reason: ReturnReason.DEFECTIVE,
      condition: ItemCondition.DEFECTIVE,
      resolution: ResolutionType.REFUND,
    },
    {
      customer: 3,
      product: 0,
      status: ReturnStatus.CLOSED,
      reason: ReturnReason.WRONG_SIZE,
      condition: ItemCondition.NEW,
      resolution: ResolutionType.EXCHANGE,
    },
    {
      customer: 4,
      product: 3,
      status: ReturnStatus.EXCHANGED,
      reason: ReturnReason.WRONG_ITEM,
      condition: ItemCondition.NEW,
      resolution: ResolutionType.EXCHANGE,
    },
  ];

  for (const [index, item] of returnData.entries()) {
    const product = products[item.product];

    const request = await prisma.returnRequest.create({
      data: {
        storeId: store.id,
        customerId: customers[item.customer].id,
        status: item.status,
        reason: item.reason,
        resolution: item.resolution,
        description: `Demo return request #${index + 1}`,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
            condition: item.condition,
          },
        },
      },
    });

    if (
      item.status === ReturnStatus.REFUNDED ||
      item.status === ReturnStatus.REFUND_PENDING
    ) {
      await prisma.refund.create({
        data: {
          returnId: request.id,
          amount: product.price,
          status:
            item.status === ReturnStatus.REFUNDED
              ? RefundStatus.COMPLETED
              : RefundStatus.PENDING,
          processedAt:
            item.status === ReturnStatus.REFUNDED ? new Date() : null,
        },
      });
    }
  }

  console.log("ReturnDesk demo data created successfully.");
  console.log("Opening stock initialized for all five products.");
  console.log("Opening stock movements recorded in the inventory ledger.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
