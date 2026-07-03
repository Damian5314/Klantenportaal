import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate, requireStaff } from "@/middleware/auth";

export const searchRouter = Router();
searchRouter.use(authenticate, requireStaff);

searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = ((req.query.q as string) ?? "").trim();
    if (q.length < 2) return res.json({ tickets: [], contacts: [], companies: [], articles: [], users: [], labels: [] });

    const insensitive = { contains: q, mode: "insensitive" as const };

    const [tickets, contacts, companies, articles, users, labels] = await Promise.all([
      prisma.ticket.findMany({
        where: { OR: [{ subject: insensitive }, { description: insensitive }] },
        select: { id: true, number: true, subject: true },
        take: 8,
      }),
      prisma.contact.findMany({
        where: { OR: [{ name: insensitive }, { email: insensitive }] },
        select: { id: true, name: true, email: true },
        take: 8,
      }),
      prisma.company.findMany({ where: { name: insensitive }, select: { id: true, name: true }, take: 8 }),
      prisma.knowledgeBaseArticle.findMany({
        where: { OR: [{ title: insensitive }, { content: insensitive }] },
        select: { id: true, slug: true, title: true },
        take: 8,
      }),
      prisma.user.findMany({ where: { name: insensitive }, select: { id: true, name: true, email: true }, take: 8 }),
      prisma.label.findMany({ where: { name: insensitive }, select: { id: true, name: true, color: true }, take: 8 }),
    ]);

    res.json({ tickets, contacts, companies, articles, users, labels });
  })
);
