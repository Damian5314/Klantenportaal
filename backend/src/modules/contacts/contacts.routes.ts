import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/middleware/validate";
import { authenticate, requirePermission } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";
import { PERMISSIONS } from "@/config/permissions";

export const contactsRouter = Router();
contactsRouter.use(authenticate);

contactsRouter.get(
  "/",
  requirePermission(PERMISSIONS.CONTACTS_MANAGE),
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string | undefined)?.trim();
    const companyId = req.query.companyId as string | undefined;
    const contacts = await prisma.contact.findMany({
      where: {
        companyId: companyId || undefined,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { company: true, user: { select: { id: true, isActive: true } } },
      orderBy: { name: "asc" },
    });
    res.json(contacts);
  })
);

contactsRouter.get(
  "/:id",
  requirePermission(PERMISSIONS.CONTACTS_MANAGE),
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        user: { select: { id: true, isActive: true, email: true } },
        tickets: {
          include: { status: true, priority: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!contact) throw ApiError.notFound("Klant niet gevonden");
    res.json(contact);
  })
);

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  companyId: z.string().optional(),
});

contactsRouter.post(
  "/",
  requirePermission(PERMISSIONS.CONTACTS_MANAGE),
  validateBody(contactSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.contact.findUnique({ where: { email: req.body.email } });
    if (existing) throw ApiError.conflict("E-mailadres is al in gebruik");
    const contact = await prisma.contact.create({ data: req.body });
    res.status(201).json(contact);
  })
);

contactsRouter.put(
  "/:id",
  requirePermission(PERMISSIONS.CONTACTS_MANAGE),
  validateBody(contactSchema.partial({ email: true }).extend({ email: z.string().email().optional() })),
  asyncHandler(async (req, res) => {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Klant niet gevonden");
    const contact = await prisma.contact.update({ where: { id: req.params.id }, data: req.body });
    res.json(contact);
  })
);

contactsRouter.delete(
  "/:id",
  requirePermission(PERMISSIONS.CONTACTS_MANAGE),
  asyncHandler(async (req, res) => {
    const existing = await prisma.contact.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Klant niet gevonden");
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const portalAccountSchema = z.object({ password: z.string().min(8) });

contactsRouter.post(
  "/:id/portal-account",
  requirePermission(PERMISSIONS.CONTACTS_MANAGE),
  validateBody(portalAccountSchema),
  asyncHandler(async (req, res) => {
    const contact = await prisma.contact.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!contact) throw ApiError.notFound("Klant niet gevonden");
    if (contact.user) throw ApiError.conflict("Klant heeft al een portaalaccount");

    let klantRole = await prisma.role.findUnique({ where: { name: "Klant" } });
    if (!klantRole) klantRole = await prisma.role.create({ data: { name: "Klant", isSystem: true } });

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({
      data: {
        email: contact.email,
        name: contact.name,
        passwordHash,
        kind: "CUSTOMER",
        roleId: klantRole.id,
        contactId: contact.id,
      },
      select: { id: true, email: true },
    });
    res.status(201).json(user);
  })
);
