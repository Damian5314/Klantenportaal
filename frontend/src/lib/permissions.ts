export const PERMISSIONS = {
  USERS_MANAGE: "users:manage",
  ROLES_MANAGE: "roles:manage",
  COMPANIES_MANAGE: "companies:manage",
  CONTACTS_MANAGE: "contacts:manage",
  TICKETS_VIEW_ALL: "tickets:view_all",
  TICKETS_CREATE: "tickets:create",
  TICKETS_UPDATE: "tickets:update",
  TICKETS_ASSIGN: "tickets:assign",
  TICKETS_DELETE: "tickets:delete",
  TICKETS_NOTES: "tickets:notes",
  TICKETS_CONFIG_MANAGE: "tickets:config_manage",
  KB_VIEW_INTERNAL: "kb:view_internal",
  KB_MANAGE: "kb:manage",
  REPORTS_VIEW: "reports:view",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
