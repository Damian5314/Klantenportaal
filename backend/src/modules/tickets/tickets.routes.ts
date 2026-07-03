import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "@/utils/asyncHandler";
import { validateBody } from "@/middleware/validate";
import { authenticate, requirePermission, requireStaff } from "@/middleware/auth";
import { ApiError } from "@/utils/apiError";
import { PERMISSIONS } from "@/config/permissions";
import * as ticketsService from "./tickets.service";

export const ticketsRouter = Router();
ticketsRouter.use(authenticate);

ticketsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    if (req.user!.kind === "STAFF" && !req.user!.permissions.includes(PERMISSIONS.TICKETS_VIEW_ALL)) {
      throw ApiError.forbidden("Onvoldoende rechten om alle tickets te bekijken");
    }
    const tickets = await ticketsService.listTickets(req.user!, req.query as ticketsService.TicketFilters);
    res.json(tickets);
  })
);

ticketsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const ticket = await ticketsService.getTicket(req.user!, req.params.id);
    res.json(ticket);
  })
);

const createSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  priorityId: z.string().min(1),
  categoryId: z.string().optional(),
});

ticketsRouter.post(
  "/",
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.kind === "STAFF" && !req.user!.permissions.includes(PERMISSIONS.TICKETS_CREATE)) {
      throw ApiError.forbidden();
    }
    const ticket = await ticketsService.createTicket(req.user!, req.body);
    res.status(201).json(ticket);
  })
);

const updateSchema = z.object({
  subject: z.string().min(1).optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  labelIds: z.array(z.string()).optional(),
});

ticketsRouter.put(
  "/:id",
  requireStaff,
  requirePermission(PERMISSIONS.TICKETS_UPDATE),
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    if (req.body.assignedToId !== undefined && !req.user!.permissions.includes(PERMISSIONS.TICKETS_ASSIGN)) {
      throw ApiError.forbidden("Onvoldoende rechten om toe te wijzen");
    }
    const ticket = await ticketsService.updateTicket(req.user!, req.params.id, req.body);
    res.json(ticket);
  })
);

const messageSchema = z.object({
  body: z.string().min(1),
  attachmentIds: z.array(z.string()).optional(),
});

ticketsRouter.post(
  "/:id/messages",
  validateBody(messageSchema),
  asyncHandler(async (req, res) => {
    const message = await ticketsService.addMessage(req.user!, req.params.id, req.body.body, req.body.attachmentIds);
    res.status(201).json(message);
  })
);

const noteSchema = z.object({
  body: z.string().min(1),
  attachmentIds: z.array(z.string()).optional(),
});

ticketsRouter.post(
  "/:id/notes",
  requireStaff,
  requirePermission(PERMISSIONS.TICKETS_NOTES),
  validateBody(noteSchema),
  asyncHandler(async (req, res) => {
    const note = await ticketsService.addInternalNote(req.user!, req.params.id, req.body.body, req.body.attachmentIds);
    res.status(201).json(note);
  })
);

const timeEntrySchema = z.object({
  minutes: z.number().int().positive(),
  description: z.string().optional(),
});

ticketsRouter.post(
  "/:id/time-entries",
  requireStaff,
  validateBody(timeEntrySchema),
  asyncHandler(async (req, res) => {
    const entry = await ticketsService.addTimeEntry(req.user!, req.params.id, req.body.minutes, req.body.description);
    res.status(201).json(entry);
  })
);
