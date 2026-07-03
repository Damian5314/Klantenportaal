import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Paperclip } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { useTicket, useUpdateTicket, useAddMessage, useAddNote, useAddTimeEntry } from "@/api/tickets";
import { useTicketCategories, useTicketPriorities, useTicketStatuses, useLabels } from "@/api/ticketConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { TicketMessageComposer } from "@/pages/tickets/TicketMessageComposer";
import type { StaffUser } from "@/types";

const HISTORY_LABELS: Record<string, string> = {
  created: "Ticket aangemaakt",
  status_changed: "Status gewijzigd",
  priority_changed: "Prioriteit gewijzigd",
  category_changed: "Categorie gewijzigd",
  assigned: "Toegewezen",
  labels_changed: "Labels gewijzigd",
  commented: "Reactie geplaatst",
  note_added: "Interne notitie toegevoegd",
};

function initialsOf(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const { data: ticket, isLoading } = useTicket(id!);
  const updateTicket = useUpdateTicket(id!);
  const addMessage = useAddMessage(id!);
  const addNote = useAddNote(id!);
  const addTimeEntry = useAddTimeEntry(id!);

  const { data: statuses = [] } = useTicketStatuses();
  const { data: priorities = [] } = useTicketPriorities();
  const { data: categories = [] } = useTicketCategories();
  const { data: labels = [] } = useLabels();

  const isStaff = user?.kind === "STAFF";
  const canUpdate = isStaff && hasPermission(PERMISSIONS.TICKETS_UPDATE);
  const canAssign = isStaff && hasPermission(PERMISSIONS.TICKETS_ASSIGN);

  const { data: staffUsers = [] } = useQuery<StaffUser[]>({
    queryKey: ["users", "staff"],
    queryFn: async () => (await api.get("/users")).data,
    enabled: canAssign,
  });

  const [timeMinutes, setTimeMinutes] = React.useState("");

  if (isLoading || !ticket) {
    return <p className="text-sm text-muted-foreground">Laden...</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">#{ticket.number}</p>
          <h1 className="text-xl font-semibold">{ticket.subject}</h1>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {ticket.labels.map((l) => (
              <Badge key={l.id} variant="outline" dotColor={l.color}>{l.name}</Badge>
            ))}
          </div>
        </div>

        <Tabs defaultValue="conversation">
          <TabsList>
            <TabsTrigger value="conversation">Conversatie</TabsTrigger>
            {isStaff && <TabsTrigger value="notes">Interne notities</TabsTrigger>}
            <TabsTrigger value="history">Historie</TabsTrigger>
          </TabsList>

          <TabsContent value="conversation" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {ticket.messages.length === 0 && <p className="text-sm text-muted-foreground">Nog geen reacties.</p>}
              {ticket.messages.map((m) => {
                const authorName = m.authorUser?.name ?? m.authorContact?.name ?? "Onbekend";
                const isCustomerAuthor = !!m.authorContact;
                return (
                  <div key={m.id} className={`flex gap-3 ${isCustomerAuthor ? "" : "flex-row-reverse"}`}>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>{initialsOf(authorName)}</AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[75%] rounded-lg p-3 text-sm ${isCustomerAuthor ? "bg-muted" : "bg-primary text-primary-foreground"}`}>
                      <div className="mb-1 flex items-center justify-between gap-4 text-xs opacity-70">
                        <span>{authorName}</span>
                        <span>{format(new Date(m.createdAt), "d MMM HH:mm", { locale: nl })}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      {m.attachments.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          {m.attachments.map((a) => (
                            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs underline">
                              <Paperclip className="h-3 w-3" /> {a.originalName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <TicketMessageComposer
              placeholder="Schrijf een reactie..."
              submitLabel="Versturen"
              onSubmit={(payload) => addMessage.mutateAsync(payload)}
            />
          </TabsContent>

          {isStaff && (
            <TabsContent value="notes" className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                {ticket.internalNotes.length === 0 && <p className="text-sm text-muted-foreground">Nog geen interne notities.</p>}
                {ticket.internalNotes.map((n) => (
                  <div key={n.id} className="rounded-lg border border-amber-400/50 bg-amber-50 p-3 text-sm dark:bg-amber-950/30">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{n.authorUser.name}</span>
                      <span>{format(new Date(n.createdAt), "d MMM HH:mm", { locale: nl })}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{n.body}</p>
                  </div>
                ))}
              </div>
              {hasPermission(PERMISSIONS.TICKETS_NOTES) && (
                <TicketMessageComposer
                  placeholder="Interne notitie (niet zichtbaar voor de klant)..."
                  submitLabel="Notitie toevoegen"
                  variant="note"
                  onSubmit={(payload) => addNote.mutateAsync(payload)}
                />
              )}

              <Card>
                <CardHeader><CardTitle className="text-sm">Tijdregistratie</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    {ticket.timeEntries.map((t) => (
                      <div key={t.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>{t.user.name} — {t.description ?? "Geen omschrijving"}</span>
                        <span>{t.minutes} min</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Minuten"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm"
                    />
                    <button
                      className="rounded-md border border-input px-3 text-xs hover:bg-accent"
                      onClick={() => {
                        const minutes = Number(timeMinutes);
                        if (minutes > 0) {
                          addTimeEntry.mutate({ minutes });
                          setTimeMinutes("");
                        }
                      }}
                    >
                      Registreren
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="history">
            <div className="flex flex-col gap-2">
              {ticket.history.map((h) => (
                <div key={h.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
                  <span>
                    <span className="font-medium">{h.actorUser?.name ?? h.actorContact?.name ?? "Systeem"}</span>
                    {" — "}
                    {HISTORY_LABELS[h.action] ?? h.action}
                    {h.fromValue && h.toValue ? ` (${h.fromValue} → ${h.toValue})` : ""}
                  </span>
                  <span className="text-xs text-muted-foreground">{format(new Date(h.createdAt), "d MMM yyyy HH:mm", { locale: nl })}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ticketgegevens</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={ticket.statusId}
                onValueChange={(v) => updateTicket.mutate({ statusId: v })}
                disabled={!canUpdate}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Prioriteit</Label>
              <Select
                value={ticket.priorityId}
                onValueChange={(v) => updateTicket.mutate({ priorityId: v })}
                disabled={!canUpdate}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Categorie</Label>
              <Select
                value={ticket.categoryId ?? undefined}
                onValueChange={(v) => updateTicket.mutate({ categoryId: v })}
                disabled={!canUpdate}
              >
                <SelectTrigger><SelectValue placeholder="Geen categorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isStaff && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Toegewezen aan</Label>
                <Select
                  value={ticket.assignedToId ?? undefined}
                  onValueChange={(v) => updateTicket.mutate({ assignedToId: v })}
                  disabled={!canAssign}
                >
                  <SelectTrigger><SelectValue placeholder="Niet toegewezen" /></SelectTrigger>
                  <SelectContent>
                    {staffUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isStaff && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">Labels</Label>
                <div className="flex flex-wrap gap-1">
                  {labels.map((l) => {
                    const active = ticket.labels.some((tl) => tl.id === l.id);
                    return (
                      <button
                        key={l.id}
                        disabled={!canUpdate}
                        onClick={() => {
                          const nextIds = active
                            ? ticket.labels.filter((tl) => tl.id !== l.id).map((tl) => tl.id)
                            : [...ticket.labels.map((tl) => tl.id), l.id];
                          updateTicket.mutate({ labelIds: nextIds });
                        }}
                      >
                        <Badge variant={active ? "default" : "outline"} dotColor={l.color}>{l.name}</Badge>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Klant</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <p className="font-medium">{ticket.contact.name}</p>
            <p className="text-muted-foreground">{ticket.contact.email}</p>
            {ticket.company && <p className="text-muted-foreground">{ticket.company.name}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
