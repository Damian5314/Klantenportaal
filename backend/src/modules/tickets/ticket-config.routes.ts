import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/middleware/validate";
import { authenticate, requirePermission } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";
import { PERMISSIONS } from "@/config/permissions";

export const ticketConfigRouter = Router();
ticketConfigRouter.use(authenticate);

// -- Read access is available to any authenticated staff/customer user so
// -- forms (create/edit ticket) can populate dropdowns.
ticketConfigRouter.get(
  "/statuses",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.ticketStatus.findMany({ orderBy: { order: "asc" } }));
  })
);
ticketConfigRouter.get(
  "/priorities",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.ticketPriority.findMany({ orderBy: { order: "asc" } }));
  })
);
ticketConfigRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.ticketCategory.findMany({ orderBy: { name: "asc" } }));
  })
);
ticketConfigRouter.get(
  "/labels",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.label.findMany({ orderBy: { name: "asc" } }));
  })
);

const manage = requirePermission(PERMISSIONS.TICKETS_CONFIG_MANAGE);

const statusSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional(),
  color: z.string().optional(),
  isClosed: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

ticketConfigRouter.post(
  "/statuses",
  manage,
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const status = await prisma.ticketStatus.create({ data: req.body });
    res.status(201).json(status);
  })
);
ticketConfigRouter.put(
  "/statuses/:id",
  manage,
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const status = await prisma.ticketStatus.update({ where: { id: req.params.id }, data: req.body });
    res.json(status);
  })
);
ticketConfigRouter.delete(
  "/statuses/:id",
  manage,
  asyncHandler(async (req, res) => {
    const inUse = await prisma.ticket.count({ where: { statusId: req.params.id } });
    if (inUse > 0) throw ApiError.conflict("Status is nog in gebruik door tickets");
    await prisma.ticketStatus.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const prioritySchema = z.object({
  name: z.string().min(1),
  order: z.number().int().optional(),
  color: z.string().optional(),
});

ticketConfigRouter.post(
  "/priorities",
  manage,
  validateBody(prioritySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.ticketPriority.create({ data: req.body }));
  })
);
ticketConfigRouter.put(
  "/priorities/:id",
  manage,
  validateBody(prioritySchema),
  asyncHandler(async (req, res) => {
    res.json(await prisma.ticketPriority.update({ where: { id: req.params.id }, data: req.body }));
  })
);
ticketConfigRouter.delete(
  "/priorities/:id",
  manage,
  asyncHandler(async (req, res) => {
    const inUse = await prisma.ticket.count({ where: { priorityId: req.params.id } });
    if (inUse > 0) throw ApiError.conflict("Prioriteit is nog in gebruik door tickets");
    await prisma.ticketPriority.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const categorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional().nullable(),
});

ticketConfigRouter.post(
  "/categories",
  manage,
  validateBody(categorySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.ticketCategory.create({ data: req.body }));
  })
);
ticketConfigRouter.put(
  "/categories/:id",
  manage,
  validateBody(categorySchema),
  asyncHandler(async (req, res) => {
    res.json(await prisma.ticketCategory.update({ where: { id: req.params.id }, data: req.body }));
  })
);
ticketConfigRouter.delete(
  "/categories/:id",
  manage,
  asyncHandler(async (req, res) => {
    await prisma.ticketCategory.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const labelSchema = z.object({ name: z.string().min(1), color: z.string().optional() });

ticketConfigRouter.post(
  "/labels",
  manage,
  validateBody(labelSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.label.create({ data: req.body }));
  })
);
ticketConfigRouter.delete(
  "/labels/:id",
  manage,
  asyncHandler(async (req, res) => {
    await prisma.label.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
