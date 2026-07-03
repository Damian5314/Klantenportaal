import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import { AccessTokenPayload } from "@/utils/tokens";
import { notify } from "@/modules/notifications/notifications.service";

export interface TicketFilters {
  statusId?: string;
  priorityId?: string;
  categoryId?: string;
  companyId?: string;
  contactId?: string;
  assignedToId?: string;
  labelId?: string;
  search?: string;
  from?: string;
  to?: string;
}

async function actorContact(actor: AccessTokenPayload) {
  const user = await prisma.user.findUnique({ where: { id: actor.sub } });
  if (!user?.contactId) throw ApiError.forbidden("Geen gekoppeld klantprofiel");
  return user.contactId;
}

export async function listTickets(actor: AccessTokenPayload, filters: TicketFilters) {
  const where: Prisma.TicketWhereInput = {
    statusId: filters.statusId,
    priorityId: filters.priorityId,
    categoryId: filters.categoryId,
    companyId: filters.companyId,
    assignedToId: filters.assignedToId,
    labels: filters.labelId ? { some: { id: filters.labelId } } : undefined,
    createdAt:
      filters.from || filters.to
        ? { gte: filters.from ? new Date(filters.from) : undefined, lte: filters.to ? new Date(filters.to) : undefined }
        : undefined,
    ...(filters.search
      ? {
          OR: [
            { subject: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (actor.kind === "CUSTOMER") {
    where.contactId = await actorContact(actor);
  } else if (filters.contactId) {
    where.contactId = filters.contactId;
  }

  return prisma.ticket.findMany({
    where,
    include: {
      status: true,
      priority: true,
      category: true,
      labels: true,
      contact: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function assertCanAccessTicket(actor: AccessTokenPayload, ticketContactId: string) {
  if (actor.kind === "CUSTOMER") {
    const contactId = await actorContact(actor);
    if (contactId !== ticketContactId) throw ApiError.forbidden("Geen toegang tot dit ticket");
  }
}

export async function getTicket(actor: AccessTokenPayload, id: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      status: true,
      priority: true,
      category: true,
      labels: true,
      contact: { select: { id: true, name: true, email: true, companyId: true } },
      company: true,
      assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      messages: {
        include: {
          authorUser: { select: { id: true, name: true, avatarUrl: true } },
          authorContact: { select: { id: true, name: true } },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
      history: {
        include: {
          actorUser: { select: { id: true, name: true } },
          actorContact: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      internalNotes: {
        include: {
          authorUser: { select: { id: true, name: true, avatarUrl: true } },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
      timeEntries: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!ticket) throw ApiError.notFound("Ticket niet gevonden");
  await assertCanAccessTicket(actor, ticket.contactId);

  if (actor.kind === "CUSTOMER") {
    return { ...ticket, internalNotes: [] };
  }
  return ticket;
}

async function logHistory(
  ticketId: string,
  actor: AccessTokenPayload,
  action: string,
  fromValue?: string | null,
  toValue?: string | null
) {
  await prisma.ticketHistoryEntry.create({
    data: {
      ticketId,
      action,
      fromValue: fromValue ?? undefined,
      toValue: toValue ?? undefined,
      actorUserId: actor.kind === "STAFF" ? actor.sub : undefined,
      actorContactId: actor.kind === "CUSTOMER" ? await actorContact(actor) : undefined,
    },
  });
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  contactId?: string; // staff can create on behalf of a contact
  companyId?: string;
  priorityId: string;
  categoryId?: string;
}

export async function createTicket(actor: AccessTokenPayload, input: CreateTicketInput) {
  const contactId = actor.kind === "CUSTOMER" ? await actorContact(actor) : input.contactId;
  if (!contactId) throw ApiError.badRequest("contactId is verplicht");

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) throw ApiError.badRequest("Onbekende klant");

  const defaultStatus = await prisma.ticketStatus.findFirst({ where: { isDefault: true } });
  if (!defaultStatus) throw ApiError.badRequest("Geen standaardstatus geconfigureerd");

  const ticket = await prisma.ticket.create({
    data: {
      subject: input.subject,
      description: input.description,
      contactId,
      companyId: input.companyId ?? contact.companyId,
      statusId: defaultStatus.id,
      priorityId: input.priorityId,
      categoryId: input.categoryId,
    },
    include: { status: true, priority: true, category: true, contact: true },
  });

  await logHistory(ticket.id, actor, "created");
  return ticket;
}

export interface UpdateTicketInput {
  subject?: string;
  statusId?: string;
  priorityId?: string;
  categoryId?: string;
  assignedToId?: string | null;
  labelIds?: string[];
}

export async function updateTicket(actor: AccessTokenPayload, id: string, input: UpdateTicketInput) {
  const existing = await prisma.ticket.findUnique({
    where: { id },
    include: { status: true, priority: true, category: true, assignedTo: true },
  });
  if (!existing) throw ApiError.notFound("Ticket niet gevonden");

  const data: Prisma.TicketUpdateInput = {};
  if (input.subject) data.subject = input.subject;

  if (input.statusId && input.statusId !== existing.statusId) {
    const status = await prisma.ticketStatus.findUnique({ where: { id: input.statusId } });
    if (!status) throw ApiError.badRequest("Onbekende status");
    data.status = { connect: { id: input.statusId } };
    data.closedAt = status.isClosed ? new Date() : null;
    await logHistory(id, actor, "status_changed", existing.status.name, status.name);
  }
  if (input.priorityId && input.priorityId !== existing.priorityId) {
    const priority = await prisma.ticketPriority.findUnique({ where: { id: input.priorityId } });
    if (!priority) throw ApiError.badRequest("Onbekende prioriteit");
    data.priority = { connect: { id: input.priorityId } };
    await logHistory(id, actor, "priority_changed", existing.priority.name, priority.name);
  }
  if (input.categoryId !== undefined && input.categoryId !== existing.categoryId) {
    data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
    await logHistory(id, actor, "category_changed", existing.categoryId ?? undefined, input.categoryId ?? undefined);
  }
  if (input.assignedToId !== undefined && input.assignedToId !== existing.assignedToId) {
    data.assignedTo = input.assignedToId ? { connect: { id: input.assignedToId } } : { disconnect: true };
    let toName: string | undefined;
    if (input.assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: input.assignedToId } });
      toName = assignee?.name;
    }
    await logHistory(id, actor, "assigned", existing.assignedTo?.name ?? undefined, toName);
    if (input.assignedToId) {
      await notify(input.assignedToId, "ticket_assigned", `Ticket #${existing.number} toegewezen`, existing.subject, `/tickets/${id}`);
    }
  }
  if (input.labelIds) {
    data.labels = { set: input.labelIds.map((labelId) => ({ id: labelId })) };
    await logHistory(id, actor, "labels_changed");
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data,
    include: { status: true, priority: true, category: true, labels: true, assignedTo: true },
  });
  return ticket;
}

export async function addMessage(actor: AccessTokenPayload, ticketId: string, body: string, attachmentIds: string[] = []) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { contact: { include: { user: true } } },
  });
  if (!ticket) throw ApiError.notFound("Ticket niet gevonden");
  await assertCanAccessTicket(actor, ticket.contactId);

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId,
      body,
      authorUserId: actor.kind === "STAFF" ? actor.sub : undefined,
      authorContactId: actor.kind === "CUSTOMER" ? await actorContact(actor) : undefined,
      attachments: attachmentIds.length ? { connect: attachmentIds.map((aid) => ({ id: aid })) } : undefined,
    },
    include: {
      authorUser: { select: { id: true, name: true, avatarUrl: true } },
      authorContact: { select: { id: true, name: true } },
      attachments: true,
    },
  });

  await logHistory(ticketId, actor, "commented");
  await prisma.ticket.update({ where: { id: ticketId }, data: { updatedAt: new Date() } });

  if (actor.kind === "CUSTOMER" && ticket.assignedToId) {
    await notify(ticket.assignedToId, "ticket_reply", `Nieuwe reactie op ticket #${ticket.number}`, body, `/tickets/${ticketId}`);
  } else if (actor.kind === "STAFF" && ticket.contact.user) {
    await notify(ticket.contact.user.id, "ticket_reply", `Nieuwe reactie op ticket #${ticket.number}`, body, `/tickets/${ticketId}`);
  }

  return message;
}

export async function addInternalNote(actor: AccessTokenPayload, ticketId: string, body: string, attachmentIds: string[] = []) {
  if (actor.kind !== "STAFF") throw ApiError.forbidden("Alleen medewerkers kunnen interne notities plaatsen");
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw ApiError.notFound("Ticket niet gevonden");

  const note = await prisma.ticketInternalNote.create({
    data: {
      ticketId,
      body,
      authorUserId: actor.sub,
      attachments: attachmentIds.length ? { connect: attachmentIds.map((aid) => ({ id: aid })) } : undefined,
    },
    include: {
      authorUser: { select: { id: true, name: true, avatarUrl: true } },
      attachments: true,
    },
  });

  await logHistory(ticketId, actor, "note_added");
  return note;
}

export async function addTimeEntry(actor: AccessTokenPayload, ticketId: string, minutes: number, description?: string) {
  if (actor.kind !== "STAFF") throw ApiError.forbidden("Alleen medewerkers kunnen tijd registreren");
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw ApiError.notFound("Ticket niet gevonden");
  return prisma.ticketTimeEntry.create({
    data: { ticketId, userId: actor.sub, minutes, description },
  });
}
