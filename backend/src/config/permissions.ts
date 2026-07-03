// Central registry of permission keys. Roles are assigned a subset of these.
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
  TICKETS_CONFIG_MANAGE: "tickets:config_manage", // statuses/priorities/categories/labels
  KB_VIEW_INTERNAL: "kb:view_internal",
  KB_MANAGE: "kb:manage",
  REPORTS_VIEW: "reports:view",
  SETTINGS_MANAGE: "settings:manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

export const ROLE_PRESETS: Record<"Admin" | "Medewerker" | "Klant", PermissionKey[]> = {
  Admin: ALL_PERMISSIONS,
  Medewerker: [
    PERMISSIONS.CONTACTS_MANAGE,
    PERMISSIONS.TICKETS_VIEW_ALL,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.TICKETS_NOTES,
    PERMISSIONS.KB_VIEW_INTERNAL,
    PERMISSIONS.KB_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  Klant: [PERMISSIONS.TICKETS_CREATE],
};
