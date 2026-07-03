import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DashboardSummary, Ticket } from "@/types";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function StaffDashboard() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get("/dashboard/summary")).data,
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Laden...</p>;

  const chartData = data.perMonth.map((m) => ({
    month: format(new Date(`${m.month}-01`), "MMM", { locale: nl }),
    count: m.count,
  }));

  const maxCategory = Math.max(1, ...data.perCategory.map((c) => c.count));
  const maxAssignee = Math.max(1, ...data.perAssignee.map((a) => a.count));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overzicht van alle supportactiviteit</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Mijn tickets" value={data.myTickets} />
        <StatTile label="Open tickets" value={data.openTickets} />
        <StatTile label="Nieuw vandaag" value={data.newToday} />
        <StatTile label="Nieuw deze week" value={data.newThisWeek} />
        <StatTile label="Gem. oplostijd" value={`${data.avgResolutionHours}u`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Tickets per maand</CardTitle></CardHeader>
          <CardContent className="h-64 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ticketsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" stroke="hsl(var(--muted-foreground))" />
                <YAxis axisLine={false} tickLine={false} width={28} allowDecimals={false} className="text-xs" stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area type="monotone" dataKey="count" name="Tickets" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ticketsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Tickets per status</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.perStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-sm">
                <Badge variant="secondary" dotColor={s.color}>{s.status}</Badge>
                <span className="tabular-nums text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Open tickets per categorie</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.perCategory.map((c) => (
              <div key={c.category} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{c.category}</span><span>{c.count}</span></div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Open tickets per medewerker</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.perAssignee.map((a) => (
              <div key={a.assignee} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-muted-foreground"><span>{a.assignee}</span><span>{a.count}</span></div>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(a.count / maxAssignee) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CustomerDashboard() {
  const { user } = useAuth();
  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => (await api.get("/tickets")).data,
  });

  const openCount = tickets.filter((t) => !t.status.isClosed).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Welkom, {user?.name}</h1>
          <p className="text-sm text-muted-foreground">Hier is een overzicht van jouw tickets</p>
        </div>
        <Button asChild><Link to="/tickets/new">Nieuw ticket</Link></Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatTile label="Totaal tickets" value={tickets.length} />
        <StatTile label="Open tickets" value={openCount} />
        <StatTile label="Opgelost" value={tickets.length - openCount} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recente tickets</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isLoading && <p className="text-sm text-muted-foreground">Laden...</p>}
          {tickets.slice(0, 8).map((t) => (
            <Link key={t.id} to={`/tickets/${t.id}`} className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-accent">
              <span className="truncate">#{t.number} {t.subject}</span>
              <Badge variant="secondary" dotColor={t.status.color}>{t.status.name}</Badge>
            </Link>
          ))}
          {!isLoading && tickets.length === 0 && <p className="text-sm text-muted-foreground">Je hebt nog geen tickets.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  return user?.kind === "STAFF" ? <StaffDashboard /> : <CustomerDashboard />;
}
