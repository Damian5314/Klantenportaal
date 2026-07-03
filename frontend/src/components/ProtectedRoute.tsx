import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Laden...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  const { hasPermission, user } = useAuth();
  if (user?.kind === "STAFF" && !hasPermission(permission)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-12 text-center">
        <p className="text-lg font-semibold">Geen toegang</p>
        <p className="text-sm text-muted-foreground">Je hebt geen rechten om deze pagina te bekijken.</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function StaffOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.kind !== "STAFF") return <Navigate to="/" replace />;
  return <>{children}</>;
}
