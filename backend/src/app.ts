import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
import { authRouter } from "@/modules/auth/auth.routes";
import { usersRouter } from "@/modules/users/users.routes";
import { rolesRouter } from "@/modules/roles/roles.routes";
import { companiesRouter } from "@/modules/companies/companies.routes";
import { contactsRouter } from "@/modules/contacts/contacts.routes";
import { ticketsRouter } from "@/modules/tickets/tickets.routes";
import { ticketConfigRouter } from "@/modules/tickets/ticket-config.routes";
import { attachmentsRouter } from "@/modules/attachments/attachments.routes";
import { kbRouter } from "@/modules/knowledgebase/kb.routes";
import { dashboardRouter } from "@/modules/dashboard/dashboard.routes";
import { notificationsRouter } from "@/modules/notifications/notifications.routes";
import { searchRouter } from "@/modules/search/search.routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
app.use("/api", apiLimiter);

app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/ticket-config", ticketConfigRouter);
app.use("/api/attachments", attachmentsRouter);
app.use("/api/knowledgebase", kbRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/search", searchRouter);

app.use(notFoundHandler);
app.use(errorHandler);
