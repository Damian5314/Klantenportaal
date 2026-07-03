export type UserKind = "STAFF" | "CUSTOMER";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  kind: UserKind;
  department?: string | null;
  jobTitle?: string | null;
  roleName: string;
  permissions: string[];
  contact?: { id: string; name: string; company: Company | null } | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: Permission[];
  _count?: { users: number };
}

export interface Permission {
  id: string;
  key: string;
  description?: string | null;
}

export interface Company {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  _count?: { contacts: number; tickets: number };
}

export interface Contract {
  id: string;
  companyId: string;
  name: string;
  reference?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
  companyId?: string | null;
  company?: Company | null;
  user?: { id: string; isActive: boolean; email?: string } | null;
}

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  kind: UserKind;
  department?: string | null;
  jobTitle?: string | null;
  isActive: boolean;
  role: { id: string; name: string };
  createdAt: string;
}

export interface TicketStatus {
  id: string;
  name: string;
  order: number;
  color: string;
  isClosed: boolean;
  isDefault: boolean;
}

export interface TicketPriority {
  id: string;
  name: string;
  order: number;
  color: string;
}

export interface TicketCategory {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  description: string;
  companyId?: string | null;
  contactId: string;
  statusId: string;
  priorityId: string;
  categoryId?: string | null;
  assignedToId?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: TicketCategory | null;
  labels: Label[];
  contact: { id: string; name: string; email: string };
  company?: { id: string; name: string } | null;
  assignedTo?: { id: string; name: string; avatarUrl?: string | null } | null;
  _count?: { messages: number };
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  body: string;
  isInboundEmail: boolean;
  createdAt: string;
  authorUser?: { id: string; name: string; avatarUrl?: string | null } | null;
  authorContact?: { id: string; name: string } | null;
  attachments: Attachment[];
}

export interface TicketInternalNote {
  id: string;
  ticketId: string;
  body: string;
  createdAt: string;
  authorUser: { id: string; name: string; avatarUrl?: string | null };
  attachments: Attachment[];
}

export interface TicketHistoryEntry {
  id: string;
  ticketId: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  createdAt: string;
  actorUser?: { id: string; name: string } | null;
  actorContact?: { id: string; name: string } | null;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  messages: TicketMessage[];
  internalNotes: TicketInternalNote[];
  history: TicketHistoryEntry[];
  attachments: Attachment[];
  timeEntries: { id: string; minutes: number; description?: string | null; user: { id: string; name: string } }[];
}

export interface KbCategory {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface KbTag {
  id: string;
  name: string;
}

export interface KbArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  visibility: "PUBLIC" | "INTERNAL";
  categoryId?: string | null;
  category?: KbCategory | null;
  tags: KbTag[];
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  versions?: { id: string; content: string; createdAt: string }[];
  attachments?: Attachment[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  myTickets: number;
  openTickets: number;
  newToday: number;
  newThisWeek: number;
  avgResolutionHours: number;
  perStatus: { status: string; color: string; count: number }[];
  perCategory: { category: string; count: number }[];
  perAssignee: { assignee: string; count: number }[];
  perMonth: { month: string; count: number }[];
}
