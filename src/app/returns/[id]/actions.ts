
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const idSchema = z.string().min(1);

const inspectionSchema = z.object({
  returnId: z.string().min(1),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        condition: z.enum(["NEW", "OPENED", "DAMAGED", "DEFECTIVE"]),
        disposition: z.enum(["RESTOCK", "OPEN_BOX", "DAMAGED", "DISCARD"]),
        notes: z.string().max(1000),
      }),
    )
    .min(1),
});

export async function markReturnReceived(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("returnId"));

  if (!parsed.success) throw new Error("Invalid return request.");

  const result = await prisma.returnRequest.updateMany({
    where: {
      id: parsed.data,
      status: "APPROVED",
    },
    data: { status: "RECEIVED" },
  });

  if (!result.count) {
    throw new Error("Only approved returns can be marked as received.");
  }

  revalidatePath("/returns");
  revalidatePath(`/returns/${parsed.data}`);
  revalidatePath("/");
}

export async function startReturnInspection(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("returnId"));

  if (!parsed.success) throw new Error("Invalid return request.");

  const result = await prisma.returnRequest.updateMany({
    where: {
      id: parsed.data,
      status: "RECEIVED",
    },
    data: { status: "INSPECTING" },
  });

  if (!result.count) {
    throw new Error("Only received returns can enter inspection.");
  }

  revalidatePath("/returns");
  revalidatePath(`/returns/${parsed.data}`);
  revalidatePath("/");
}

export async function saveInspection(formData: FormData) {
  const rawIds = formData.getAll("itemId");
  const rawConditions = formData.getAll("condition");
  const rawDispositions = formData.getAll("disposition");
  const rawNotes = formData.getAll("notes");

  const parsed = inspectionSchema.safeParse({
    returnId: formData.get("returnId"),
    items: rawIds.map((id, index) => ({
      id,
      condition: rawConditions[index],
      disposition: rawDispositions[index],
      notes: rawNotes[index] ?? "",
    })),
  });

  if (!parsed.success) {
    throw new Error("Invalid inspection data.");
  }

  const returnId = parsed.data.returnId;

  await prisma.$transaction(async (tx) => {
    const request = await tx.returnRequest.findFirst({
      where: {
        id: returnId,
        status: "INSPECTING",
      },
      include: { items: true },
    });

    if (!request) {
      throw new Error("This return is not currently being inspected.");
    }

    const submittedIds = parsed.data.items.map((item) => item.id);
    const actualIds = request.items.map((item) => item.id);

    if (
      new Set(submittedIds).size !== submittedIds.length ||
      submittedIds.length !== actualIds.length ||
      actualIds.some((id) => !submittedIds.includes(id))
    ) {
      throw new Error("Inspection items do not match this return request.");
    }

    for (const item of parsed.data.items) {
      const existingItem = request.items.find(
        (requestItem) => requestItem.id === item.id,
      );

      if (!existingItem || existingItem.dispositionAt) {
        throw new Error("An inventory-processed item cannot be edited.");
      }

      await tx.returnItem.update({
        where: {
          id: item.id,
        },
        data: {
          condition: item.condition,
          disposition: item.disposition,
          notes: item.notes.trim() || null,
        },
      });
    }
  });

  revalidatePath("/returns");
  revalidatePath(`/returns/${returnId}`);
}

export async function completeInspection(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("returnId"));

  if (!parsed.success) {
    throw new Error("Invalid return request.");
  }

  const returnId = parsed.data;

  await prisma.$transaction(async (tx) => {
    const request = await tx.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        items: {
          include: {
            product: true,
            inventoryMovement: true,
          },
        },
        refund: true,
      },
    });

    if (!request || request.status !== "INSPECTING") {
      throw new Error("This return is not currently being inspected.");
    }

    if (!request.resolution) {
      throw new Error(
        "A resolution must be selected before completing inspection.",
      );
    }

    if (request.items.length === 0) {
      throw new Error("This return has no items to inspect.");
    }

    if (request.items.some((item) => item.condition === "UNINSPECTED")) {
      throw new Error("Inspect every item before completing the inspection.");
    }

    if (request.items.some((item) => !item.disposition)) {
      throw new Error(
        "Choose an inventory disposition for every item before completing inspection.",
      );
    }

    if (
      request.items.some(
        (item) => item.dispositionAt || item.inventoryMovement,
      )
    ) {
      throw new Error(
        "Inventory has already been processed for at least one item.",
      );
    }

    if (request.resolution === "EXCHANGE") {
      throw new Error(
        "Exchange processing is not available yet. Select a refund or store credit resolution.",
      );
    }

    const amount = request.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    if (request.refund) {
      throw new Error("A refund record already exists for this return.");
    }

    for (const item of request.items) {
      const quantity = item.quantity;

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error("Return item quantities must be positive integers.");
      }

      const disposition = item.disposition!;

      const inventoryUpdate = {
        sellableQuantity: 0,
        openBoxQuantity: 0,
        damagedQuantity: 0,
        discardedQuantity: 0,
      };

      switch (disposition) {
        case "RESTOCK":
          inventoryUpdate.sellableQuantity = quantity;
          break;
        case "OPEN_BOX":
          inventoryUpdate.openBoxQuantity = quantity;
          break;
        case "DAMAGED":
          inventoryUpdate.damagedQuantity = quantity;
          break;
        case "DISCARD":
          inventoryUpdate.discardedQuantity = quantity;
          break;
      }

      await tx.productInventory.upsert({
        where: {
          productId: item.productId,
        },
        create: {
          productId: item.productId,
          ...inventoryUpdate,
        },
        update: {
          sellableQuantity: { increment: inventoryUpdate.sellableQuantity },
          openBoxQuantity: { increment: inventoryUpdate.openBoxQuantity },
          damagedQuantity: { increment: inventoryUpdate.damagedQuantity },
          discardedQuantity: { increment: inventoryUpdate.discardedQuantity },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          returnItemId: item.id,
            type: "RETURN",
          disposition,
          quantity,
        },
      });

      await tx.returnItem.update({
        where: { id: item.id },
        data: {
          dispositionAt: new Date(),
        },
      });
    }

    const statusUpdate = await tx.returnRequest.updateMany({
      where: {
        id: returnId,
        status: "INSPECTING",
      },
      data: {
        status: "REFUND_PENDING",
      },
    });

    if (statusUpdate.count !== 1) {
      throw new Error(
        "Return status changed during processing. Refresh and try again.",
      );
    }

    await tx.refund.create({
      data: {
        returnId,
        amount,
        status: "PENDING",
      },
    });
  });

  revalidatePath("/returns");
  revalidatePath("/refunds");
  revalidatePath("/inventory");
  revalidatePath(`/returns/${returnId}`);
  revalidatePath("/");
}
