import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Plus, Search } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useTicketCategories, useTicketPriorities, useTicketStatuses } from "@/api/ticketConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Ticket } from "@/types";

const ALL = "__all__";

export function TicketsListPage() {
  const { user } = useAuth();
  const [search, setSearch] = React.useState("");
  const [statusId, setStatusId] = React.useState(ALL);
  const [priorityId, setPriorityId] = React.useState(ALL);
  const [categoryId, setCategoryId] = React.useState(ALL);

  const { data: statuses = [] } = useTicketStatuses();
  const { data: priorities = [] } = useTicketPriorities();
  const { data: categories = [] } = useTicketCategories();

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["tickets", { search, statusId, priorityId, categoryId }],
    queryFn: async () =>
      (
        await api.get("/tickets", {
          params: {
            search: search || undefined,
            statusId: statusId === ALL ? undefined : statusId,
            priorityId: priorityId === ALL ? undefined : priorityId,
            categoryId: categoryId === ALL ? undefined : categoryId,
          },
        })
      ).data,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{user?.kind === "STAFF" ? "Tickets" : "Mijn tickets"}</h1>
          <p className="text-sm text-muted-foreground">{tickets.length} tickets gevonden</p>
        </div>
        <Button asChild>
          <Link to="/tickets/new">
            <Plus className="h-4 w-4" /> Nieuw ticket
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Zoeken..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusId} onValueChange={setStatusId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Alle statussen</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityId} onValueChange={setPriorityId}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Prioriteit" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Alle prioriteiten</SelectItem>
            {priorities.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Categorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Alle categorieën</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Onderwerp</TableHead>
              <TableHead>Klant</TableHead>
              {user?.kind === "STAFF" && <TableHead>Bedrijf</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Prioriteit</TableHead>
              {user?.kind === "STAFF" && <TableHead>Toegewezen</TableHead>}
              <TableHead>Laatste update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">Laden...</TableCell>
              </TableRow>
            )}
            {!isLoading && tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">Geen tickets gevonden</TableCell>
              </TableRow>
            )}
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs">
                  <Link to={`/tickets/${ticket.id}`} className="block">#{ticket.number}</Link>
                </TableCell>
                <TableCell>
                  <Link to={`/tickets/${ticket.id}`} className="font-medium hover:underline">{ticket.subject}</Link>
                </TableCell>
                <TableCell>{ticket.contact.name}</TableCell>
                {user?.kind === "STAFF" && <TableCell>{ticket.company?.name ?? "-"}</TableCell>}
                <TableCell>
                  <Badge variant="secondary" dotColor={ticket.status.color}>{ticket.status.name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" dotColor={ticket.priority.color}>{ticket.priority.name}</Badge>
                </TableCell>
                {user?.kind === "STAFF" && <TableCell>{ticket.assignedTo?.name ?? "Niet toegewezen"}</TableCell>}
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(ticket.updatedAt), "d MMM yyyy HH:mm", { locale: nl })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
