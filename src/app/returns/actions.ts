
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const actionSchema = z.object({
  returnId: z.string().min(1),
});

const reviewableStatuses = ["REQUESTED", "UNDER_REVIEW"] as const;

export async function approveReturn(formData: FormData) {
  const parsed = actionSchema.safeParse({
    returnId: formData.get("returnId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid return request.");
  }

  const result = await prisma.returnRequest.updateMany({
    where: {
      id: parsed.data.returnId,
      status: { in: [...reviewableStatuses] },
    },
    data: {
      status: "APPROVED",
    },
  });

  if (result.count === 0) {
    throw new Error("This request cannot be approved in its current state.");
  }

  revalidatePath("/returns");
  revalidatePath("/");
}

export async function rejectReturn(formData: FormData) {
  const parsed = actionSchema.safeParse({
    returnId: formData.get("returnId"),
  });

  if (!parsed.success) {
    throw new Error("Invalid return request.");
  }

  const result = await prisma.returnRequest.updateMany({
    where: {
      id: parsed.data.returnId,
      status: { in: [...reviewableStatuses] },
    },
    data: {
      status: "REJECTED",
    },
  });

  if (result.count === 0) {
    throw new Error("This request cannot be rejected in its current state.");
  }

  revalidatePath("/returns");
  revalidatePath("/");
}
