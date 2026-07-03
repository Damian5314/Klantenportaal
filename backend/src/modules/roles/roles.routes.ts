import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/middleware/validate";
import { authenticate, requirePermission } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";
import { ALL_PERMISSIONS, PERMISSIONS } from "@/config/permissions";

export const rolesRouter = Router();
rolesRouter.use(authenticate);

rolesRouter.get(
  "/permissions",
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  asyncHandler(async (_req, res) => {
    const permissions = await prisma.permission.findMany({ orderBy: { key: "asc" } });
    res.json(permissions);
  })
);

rolesRouter.get(
  "/",
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({
      include: { permissions: true, _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    });
    res.json(roles);
  })
);

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissionKeys: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])),
});

rolesRouter.post(
  "/",
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  validateBody(roleSchema),
  asyncHandler(async (req, res) => {
    const { name, description, permissionKeys } = req.body;
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: { connect: permissionKeys.map((key: string) => ({ key })) },
      },
      include: { permissions: true },
    });
    res.status(201).json(role);
  })
);

rolesRouter.put(
  "/:id",
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  validateBody(roleSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Rol niet gevonden");
    const { name, description, permissionKeys } = req.body;
    const role = await prisma.role.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        permissions: { set: permissionKeys.map((key: string) => ({ key })) },
      },
      include: { permissions: true },
    });
    res.json(role);
  })
);

rolesRouter.delete(
  "/:id",
  requirePermission(PERMISSIONS.ROLES_MANAGE),
  asyncHandler(async (req, res) => {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Rol niet gevonden");
    if (existing.isSystem) throw ApiError.badRequest("Systeemrollen kunnen niet worden verwijderd");
    await prisma.role.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
