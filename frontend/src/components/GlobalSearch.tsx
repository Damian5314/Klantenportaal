import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, FileText, Tag, Ticket as TicketIcon, User as UserIcon } from "lucide-react";
import { api } from "@/api/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SearchResults {
  tickets: { id: string; number: number; subject: string }[];
  contacts: { id: string; name: string; email: string }[];
  companies: { id: string; name: string }[];
  articles: { id: string; slug: string; title: string }[];
  users: { id: string; name: string; email: string }[];
  labels: { id: string; name: string; color: string }[];
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = React.useState("");
  const navigate = useNavigate();

  const { data } = useQuery<SearchResults>({
    queryKey: ["global-search", query],
    queryFn: async () => (await api.get("/search", { params: { q: query } })).data,
    enabled: open && query.trim().length >= 2,
  });

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  function go(path: string) {
    onOpenChange(false);
    navigate(path);
  }

  const hasResults =
    data && (data.tickets.length || data.contacts.length || data.companies.length || data.articles.length || data.users.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-xl translate-y-0 p-0">
        <DialogTitle className="sr-only">Zoeken</DialogTitle>
        <Input
          autoFocus
          placeholder="Zoek tickets, klanten, bedrijven, kennisbank..."
          className="h-12 rounded-none border-0 border-b text-base focus-visible:ring-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim().length < 2 && <p className="p-4 text-sm text-muted-foreground">Typ minimaal 2 tekens...</p>}
          {query.trim().length >= 2 && !hasResults && <p className="p-4 text-sm text-muted-foreground">Geen resultaten</p>}

          {!!data?.tickets.length && (
            <ResultGroup label="Tickets">
              {data.tickets.map((t) => (
                <ResultRow key={t.id} icon={TicketIcon} label={`#${t.number} ${t.subject}`} onClick={() => go(`/tickets/${t.id}`)} />
              ))}
            </ResultGroup>
          )}
          {!!data?.contacts.length && (
            <ResultGroup label="Klanten">
              {data.contacts.map((c) => (
                <ResultRow key={c.id} icon={UserIcon} label={`${c.name} (${c.email})`} onClick={() => go(`/contacts/${c.id}`)} />
              ))}
            </ResultGroup>
          )}
          {!!data?.companies.length && (
            <ResultGroup label="Bedrijven">
              {data.companies.map((c) => (
                <ResultRow key={c.id} icon={Building2} label={c.name} onClick={() => go(`/companies/${c.id}`)} />
              ))}
            </ResultGroup>
          )}
          {!!data?.articles.length && (
            <ResultGroup label="Kennisbank">
              {data.articles.map((a) => (
                <ResultRow key={a.id} icon={FileText} label={a.title} onClick={() => go(`/knowledgebase/${a.slug}`)} />
              ))}
            </ResultGroup>
          )}
          {!!data?.users.length && (
            <ResultGroup label="Gebruikers">
              {data.users.map((u) => (
                <ResultRow key={u.id} icon={Tag} label={u.name} onClick={() => go(`/users`)} />
              ))}
            </ResultGroup>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function ResultRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </button>
  );
}
