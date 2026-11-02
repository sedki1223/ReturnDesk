
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [
    totalReturns,
    pendingReturns,
    completedRefunds,
    refundTotal,
    recentReturns,
  ] = await Promise.all([
    prisma.returnRequest.count(),

    prisma.returnRequest.count({
      where: {
        status: {
          in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "REFUND_PENDING"],
        },
      },
    }),

    prisma.refund.count({
      where: { status: "COMPLETED" },
    }),

    prisma.refund.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),

    prisma.returnRequest.findMany({
      take: 8,
      orderBy: { requestedAt: "desc" },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        refund: true,
      },
    }),
  ]);

  const approvedReturns = await prisma.returnRequest.count({
    where: {
      status: {
        in: ["APPROVED", "RECEIVED", "INSPECTING", "REFUND_PENDING", "REFUNDED", "EXCHANGED", "CLOSED"],
      },
    },
  });

  const rejectedReturns = await prisma.returnRequest.count({
    where: { status: "REJECTED" },
  });

  const decidedReturns = approvedReturns + rejectedReturns;

  return {
    totalReturns,
    pendingReturns,
    completedRefunds,
    refundTotal: Number(refundTotal._sum.amount ?? 0),
    approvalRate: decidedReturns
      ? Math.round((approvedReturns / decidedReturns) * 100)
      : 0,
    recentReturns,
  };
}
