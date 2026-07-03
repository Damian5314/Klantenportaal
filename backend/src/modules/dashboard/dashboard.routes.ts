import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requireStaff } from "@/middleware/auth";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, requireStaff);

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek() {
  const d = startOfDay();
  const day = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (day - 1));
  return d;
}

dashboardRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;

    const [myTickets, openTickets, newToday, newThisWeek, closedStatuses] = await Promise.all([
      prisma.ticket.count({ where: { assignedToId: userId, status: { isClosed: false } } }),
      prisma.ticket.count({ where: { status: { isClosed: false } } }),
      prisma.ticket.count({ where: { createdAt: { gte: startOfDay() } } }),
      prisma.ticket.count({ where: { createdAt: { gte: startOfWeek() } } }),
      prisma.ticketStatus.findMany({ where: { isClosed: true }, select: { id: true } }),
    ]);

    const resolvedTickets = await prisma.ticket.findMany({
      where: { closedAt: { not: null } },
      select: { createdAt: true, closedAt: true },
      take: 500,
      orderBy: { closedAt: "desc" },
    });
    const avgResolutionMs =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => sum + (t.closedAt!.getTime() - t.createdAt.getTime()), 0) /
          resolvedTickets.length
        : 0;

    const perStatusRaw = await prisma.ticket.groupBy({ by: ["statusId"], _count: { _all: true } });
    const statuses = await prisma.ticketStatus.findMany();
    const perStatus = perStatusRaw.map((row) => ({
      status: statuses.find((s) => s.id === row.statusId)?.name ?? "Onbekend",
      color: statuses.find((s) => s.id === row.statusId)?.color ?? "#64748b",
      count: row._count._all,
    }));

    const perCategoryRaw = await prisma.ticket.groupBy({ by: ["categoryId"], _count: { _all: true } });
    const categories = await prisma.ticketCategory.findMany();
    const perCategory = perCategoryRaw.map((row) => ({
      category: categories.find((c) => c.id === row.categoryId)?.name ?? "Overig",
      count: row._count._all,
    }));

    const perAssigneeRaw = await prisma.ticket.groupBy({
      by: ["assignedToId"],
      _count: { _all: true },
      where: { status: { isClosed: false } },
    });
    const users = await prisma.user.findMany({ where: { kind: "STAFF" } });
    const perAssignee = perAssigneeRaw.map((row) => ({
      assignee: users.find((u) => u.id === row.assignedToId)?.name ?? "Niet toegewezen",
      count: row._count._all,
    }));

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const recentTickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    });
    const perMonthMap = new Map<string, number>();
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(d.getMonth() + i);
      perMonthMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
    }
    for (const t of recentTickets) {
      const key = `${t.createdAt.getFullYear()}-${String(t.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (perMonthMap.has(key)) perMonthMap.set(key, (perMonthMap.get(key) ?? 0) + 1);
    }

    res.json({
      myTickets,
      openTickets,
      newToday,
      newThisWeek,
      avgResolutionHours: Math.round((avgResolutionMs / 1000 / 60 / 60) * 10) / 10,
      perStatus,
      perCategory,
      perAssignee,
      perMonth: Array.from(perMonthMap.entries()).map(([month, count]) => ({ month, count })),
    });
  })
);
