import { Router } from "express";
import { prisma } from "@/lib/prisma";
import { asyncHandler } from "@/utils/asyncHandler";
import { authenticate } from "@/middleware/auth";
import { upload } from "@/middleware/upload";
import { ApiError } from "@/utils/apiError";

export const attachmentsRouter = Router();
attachmentsRouter.use(authenticate);

attachmentsRouter.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("Geen bestand ontvangen");
    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        uploadedByUserId: req.user!.kind === "STAFF" ? req.user!.sub : undefined,
        uploadedByContactId:
          req.user!.kind === "CUSTOMER"
            ? (await prisma.user.findUnique({ where: { id: req.user!.sub } }))?.contactId ?? undefined
            : undefined,
      },
    });
    res.status(201).json(attachment);
  })
);
