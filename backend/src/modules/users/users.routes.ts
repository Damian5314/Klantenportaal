import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/middleware/validate";
import { authenticate, requirePermission, requireStaff } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";
import { PERMISSIONS } from "@/config/permissions";

export const usersRouter = Router();
usersRouter.use(authenticate);

const userListSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  kind: true,
  department: true,
  jobTitle: true,
  isActive: true,
  createdAt: true,
  role: { select: { id: true, name: true } },
} as const;

usersRouter.get(
  "/",
  requireStaff,
  asyncHandler(async (req, res) => {
    const kind = req.query.kind as string | undefined;
    // Listing the staff directory (for e.g. ticket assignment) is available to any staff
    // member; listing customer portal accounts is sensitive and requires USERS_MANAGE.
    if (kind === "CUSTOMER" && !req.user!.permissions.includes(PERMISSIONS.USERS_MANAGE)) {
      throw ApiError.forbidden();
    }
    const users = await prisma.user.findMany({
      where: { kind: kind === "CUSTOMER" ? "CUSTOMER" : "STAFF" },
      select: userListSelect,
      orderBy: { name: "asc" },
    });
    res.json(users);
  })
);

usersRouter.get(
  "/:id",
  requirePermission(PERMISSIONS.USERS_MANAGE),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: userListSelect });
    if (!user) throw ApiError.notFound("Gebruiker niet gevonden");
    res.json(user);
  })
);

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  roleId: z.string().min(1),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
});

usersRouter.post(
  "/",
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { email, name, password, roleId, department, jobTitle } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("E-mailadres is al in gebruik");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash, roleId, department, jobTitle, kind: "STAFF" },
      select: userListSelect,
    });
    res.status(201).json(user);
  })
);

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().optional(),
});

usersRouter.put(
  "/:id",
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Gebruiker niet gevonden");
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      select: userListSelect,
    });
    res.json(user);
  })
);

const resetPasswordSchema = z.object({ password: z.string().min(8) });

usersRouter.post(
  "/:id/reset-password",
  requirePermission(PERMISSIONS.USERS_MANAGE),
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Gebruiker niet gevonden");
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    res.status(204).send();
  })
);
