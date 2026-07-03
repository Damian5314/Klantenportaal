import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, RequirePermission, StaffOnly } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { TicketsListPage } from "@/pages/tickets/TicketsListPage";
import { TicketDetailPage } from "@/pages/tickets/TicketDetailPage";
import { NewTicketPage } from "@/pages/tickets/NewTicketPage";
import { CompaniesPage } from "@/pages/companies/CompaniesPage";
import { CompanyDetailPage } from "@/pages/companies/CompanyDetailPage";
import { ContactsPage } from "@/pages/contacts/ContactsPage";
import { ContactDetailPage } from "@/pages/contacts/ContactDetailPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { RolesPage } from "@/pages/admin/RolesPage";
import { SettingsPage } from "@/pages/admin/SettingsPage";
import { KnowledgeBaseListPage } from "@/pages/knowledgebase/KnowledgeBaseListPage";
import { KnowledgeBaseArticlePage } from "@/pages/knowledgebase/KnowledgeBaseArticlePage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PERMISSIONS } from "@/lib/permissions";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/tickets" element={<TicketsListPage />} />
          <Route path="/tickets/new" element={<NewTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />

          <Route
            path="/companies"
            element={
              <StaffOnly>
                <RequirePermission permission={PERMISSIONS.COMPANIES_MANAGE}>
                  <CompaniesPage />
                </RequirePermission>
              </StaffOnly>
            }
          />
          <Route
            path="/companies/:id"
            element={
              <StaffOnly>
                <RequirePermission permission={PERMISSIONS.COMPANIES_MANAGE}>
                  <CompanyDetailPage />
                </RequirePermission>
              </StaffOnly>
            }
          />

          <Route
            path="/contacts"
            element={
              <StaffOnly>
                <RequirePermission permission={PERMISSIONS.CONTACTS_MANAGE}>
                  <ContactsPage />
                </RequirePermission>
              </StaffOnly>
            }
          />
          <Route
            path="/contacts/:id"
            element={
              <StaffOnly>
                <RequirePermission permission={PERMISSIONS.CONTACTS_MANAGE}>
                  <ContactDetailPage />
                </RequirePermission>
              </StaffOnly>
            }
          />

          <Route path="/knowledgebase" element={<KnowledgeBaseListPage />} />
          <Route path="/knowledgebase/:slug" element={<KnowledgeBaseArticlePage />} />

          <Route
            path="/users"
            element={
              <StaffOnly>
                <RequirePermission permission={PERMISSIONS.USERS_MANAGE}>
                  <UsersPage />
                </RequirePermission>
              </StaffOnly>
            }
          />
          <Route
            path="/roles"
            element={
              <StaffOnly>
                <RequirePermission permission={PERMISSIONS.ROLES_MANAGE}>
                  <RolesPage />
                </RequirePermission>
              </StaffOnly>
            }
          />
          <Route
            path="/settings"
            element={
              <StaffOnly>
                <RequirePermission permission={PERMISSIONS.TICKETS_CONFIG_MANAGE}>
                  <SettingsPage />
                </RequirePermission>
              </StaffOnly>
            }
          />

          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
