import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  })
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user!.sub) throw ApiError.notFound("Melding niet gevonden");
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.status(204).send();
  })
);

notificationsRouter.post(
  "/mark-all-read",
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user!.sub, isRead: false }, data: { isRead: true } });
    res.status(204).send();
  })
);
