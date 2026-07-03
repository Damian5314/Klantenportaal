import * as React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Building2,
  Users,
  BookOpen,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationsMenu } from "@/components/NotificationsMenu";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  show: boolean;
}

export function AppLayout() {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  const isStaff = user?.kind === "STAFF";

  const navItems: NavItem[] = isStaff
    ? [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
        { to: "/tickets", label: "Tickets", icon: TicketIcon, show: true },
        { to: "/companies", label: "Bedrijven", icon: Building2, show: hasPermission(PERMISSIONS.COMPANIES_MANAGE) },
        { to: "/contacts", label: "Klanten", icon: Users, show: hasPermission(PERMISSIONS.CONTACTS_MANAGE) },
        { to: "/knowledgebase", label: "Kennisbank", icon: BookOpen, show: true },
        { to: "/users", label: "Gebruikers", icon: ShieldCheck, show: hasPermission(PERMISSIONS.USERS_MANAGE) },
        { to: "/settings", label: "Instellingen", icon: Settings, show: hasPermission(PERMISSIONS.TICKETS_CONFIG_MANAGE) },
      ]
    : [
        { to: "/dashboard", label: "Mijn tickets", icon: TicketIcon, show: true },
        { to: "/knowledgebase", label: "Kennisbank", icon: BookOpen, show: true },
      ];

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const initials = user?.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            K
          </div>
          <span className="font-semibold">Klantenportaal</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            {isStaff && (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-64 items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent"
              >
                <Search className="h-4 w-4" />
                Zoeken...
                <kbd className="ml-auto rounded border border-border px-1 text-[10px]">Ctrl K</kbd>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationsMenu>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </NotificationsMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user?.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user?.roleName}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Mijn profiel</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
