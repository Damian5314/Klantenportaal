import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/middleware/validate";
import { authenticate, requirePermission } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";
import { PERMISSIONS } from "@/config/permissions";

export const companiesRouter = Router();
companiesRouter.use(authenticate);

companiesRouter.get(
  "/",
  requirePermission(PERMISSIONS.COMPANIES_MANAGE),
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string | undefined)?.trim();
    const companies = await prisma.company.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : undefined,
      include: {
        _count: { select: { contacts: true, tickets: true } },
      },
      orderBy: { name: "asc" },
    });
    res.json(companies);
  })
);

companiesRouter.get(
  "/:id",
  requirePermission(PERMISSIONS.COMPANIES_MANAGE),
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: true,
        contracts: true,
        tickets: {
          include: { status: true, priority: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
    if (!company) throw ApiError.notFound("Bedrijf niet gevonden");
    res.json(company);
  })
);

const companySchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

companiesRouter.post(
  "/",
  requirePermission(PERMISSIONS.COMPANIES_MANAGE),
  validateBody(companySchema),
  asyncHandler(async (req, res) => {
    const company = await prisma.company.create({ data: req.body });
    res.status(201).json(company);
  })
);

companiesRouter.put(
  "/:id",
  requirePermission(PERMISSIONS.COMPANIES_MANAGE),
  validateBody(companySchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Bedrijf niet gevonden");
    const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
    res.json(company);
  })
);

companiesRouter.delete(
  "/:id",
  requirePermission(PERMISSIONS.COMPANIES_MANAGE),
  asyncHandler(async (req, res) => {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Bedrijf niet gevonden");
    await prisma.company.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const contractSchema = z.object({
  name: z.string().min(1),
  reference: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

companiesRouter.post(
  "/:id/contracts",
  requirePermission(PERMISSIONS.COMPANIES_MANAGE),
  validateBody(contractSchema),
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!company) throw ApiError.notFound("Bedrijf niet gevonden");
    const contract = await prisma.contract.create({ data: { ...req.body, companyId: company.id } });
    res.status(201).json(contract);
  })
);
