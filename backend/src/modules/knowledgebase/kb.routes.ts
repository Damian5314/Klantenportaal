import { Router } from "express";
import slugify from "slugify";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/middleware/validate";
import { authenticate, requirePermission } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";
import { PERMISSIONS } from "@/config/permissions";

export const kbRouter = Router();
kbRouter.use(authenticate);

function canSeeInternal(req: import("express").Request) {
  return req.user!.kind === "STAFF" && req.user!.permissions.includes(PERMISSIONS.KB_VIEW_INTERNAL);
}

kbRouter.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.knowledgeBaseCategory.findMany({ orderBy: { name: "asc" } }));
  })
);

kbRouter.get(
  "/tags",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.kbTag.findMany({ orderBy: { name: "asc" } }));
  })
);

kbRouter.get(
  "/articles",
  asyncHandler(async (req, res) => {
    const search = (req.query.search as string | undefined)?.trim();
    const categoryId = req.query.categoryId as string | undefined;
    const visibilityFilter = canSeeInternal(req) ? undefined : ("PUBLIC" as const);

    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: {
        categoryId,
        visibility: visibilityFilter,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true, tags: true, author: { select: { id: true, name: true } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json(articles);
  })
);

kbRouter.get(
  "/articles/:slug",
  asyncHandler(async (req, res) => {
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        tags: true,
        author: { select: { id: true, name: true } },
        attachments: true,
        versions: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!article) throw ApiError.notFound("Artikel niet gevonden");
    if (article.visibility === "INTERNAL" && !canSeeInternal(req)) throw ApiError.forbidden();
    res.json(article);
  })
);

const articleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  categoryId: z.string().optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]).default("INTERNAL"),
  tagNames: z.array(z.string()).optional(),
});

async function resolveTags(tagNames: string[] = []) {
  const tags = [];
  for (const name of tagNames) {
    const tag = await prisma.kbTag.upsert({ where: { name }, update: {}, create: { name } });
    tags.push({ id: tag.id });
  }
  return tags;
}

kbRouter.post(
  "/articles",
  requirePermission(PERMISSIONS.KB_MANAGE),
  validateBody(articleSchema),
  asyncHandler(async (req, res) => {
    const { title, content, categoryId, visibility, tagNames } = req.body;
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.knowledgeBaseArticle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }
    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        visibility,
        authorId: req.user!.sub,
        tags: { connect: await resolveTags(tagNames) },
      },
      include: { category: true, tags: true },
    });
    res.status(201).json(article);
  })
);

kbRouter.put(
  "/articles/:id",
  requirePermission(PERMISSIONS.KB_MANAGE),
  validateBody(articleSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.knowledgeBaseArticle.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Artikel niet gevonden");

    if (existing.content !== req.body.content) {
      await prisma.knowledgeBaseArticleVersion.create({
        data: { articleId: existing.id, content: existing.content, editedById: req.user!.sub },
      });
    }

    const { title, content, categoryId, visibility, tagNames } = req.body;
    const article = await prisma.knowledgeBaseArticle.update({
      where: { id: req.params.id },
      data: {
        title,
        content,
        categoryId,
        visibility,
        tags: { set: await resolveTags(tagNames) },
      },
      include: { category: true, tags: true },
    });
    res.json(article);
  })
);

kbRouter.delete(
  "/articles/:id",
  requirePermission(PERMISSIONS.KB_MANAGE),
  asyncHandler(async (req, res) => {
    await prisma.knowledgeBaseArticle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const categorySchema = z.object({ name: z.string().min(1), parentId: z.string().optional().nullable() });

kbRouter.post(
  "/categories",
  requirePermission(PERMISSIONS.KB_MANAGE),
  validateBody(categorySchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await prisma.knowledgeBaseCategory.create({ data: req.body }));
  })
);
