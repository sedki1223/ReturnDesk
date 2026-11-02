
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const refundSchema = z.object({
  refundId: z.string().min(1),
  nextStatus: z.enum(["PROCESSING", "COMPLETED", "FAILED"]),
});

type RefundStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
type RefundNextStatus = "PROCESSING" | "COMPLETED" | "FAILED";

const allowedTransitions: Record<
  RefundStatus,
  readonly RefundNextStatus[]
> = {
  PENDING: ["PROCESSING"],
  PROCESSING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: [],
};

export async function updateRefundStatus(formData: FormData) {
  const parsed = refundSchema.safeParse({
    refundId: formData.get("refundId"),
    nextStatus: formData.get("nextStatus"),
  });

  if (!parsed.success) {
    throw new Error("Invalid refund update.");
  }

  const { refundId, nextStatus } = parsed.data;

  const returnId = await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      select: {
        id: true,
        returnId: true,
        status: true,
      },
    });

    if (!refund) {
      throw new Error("Refund not found.");
    }

    const allowed = allowedTransitions[refund.status as RefundStatus];

    if (!allowed.includes(nextStatus)) {
      throw new Error("This refund cannot transition to that status.");
    }

    const refundUpdate = await tx.refund.updateMany({
      where: {
        id: refundId,
        status: refund.status,
      },
      data: {
        status: nextStatus,
        ...(nextStatus === "COMPLETED"
          ? { processedAt: new Date() }
          : {}),
      },
    });

    if (refundUpdate.count !== 1) {
      throw new Error("Refund status changed. Refresh and try again.");
    }

    if (nextStatus === "COMPLETED") {
      const returnUpdate = await tx.returnRequest.updateMany({
        where: {
          id: refund.returnId,
          status: "REFUND_PENDING",
        },
        data: {
          status: "REFUNDED",
        },
      });

      if (returnUpdate.count !== 1) {
        throw new Error(
          "Refund could not be completed because the return is not awaiting a refund.",
        );
      }
    }

    return refund.returnId;
  });

  revalidatePath("/refunds");
  revalidatePath("/returns");
  revalidatePath(`/returns/${returnId}`);
  revalidatePath("/");
}
