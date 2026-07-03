import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Company, Contact, Contract, Ticket } from "@/types";

interface CompanyDetail extends Company {
  contacts: Contact[];
  contracts: Contract[];
  tickets: Ticket[];
}

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: company, isLoading } = useQuery<CompanyDetail>({
    queryKey: ["company", id],
    queryFn: async () => (await api.get(`/companies/${id}`)).data,
  });

  if (isLoading || !company) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{company.name}</h1>
        <p className="text-sm text-muted-foreground">{company.email} {company.phone && `· ${company.phone}`}</p>
        {company.address && <p className="text-sm text-muted-foreground">{company.address}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contactpersonen</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Naam</TableHead><TableHead>E-mail</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {company.contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><Link to={`/contacts/${c.id}`} className="hover:underline">{c.name}</Link></TableCell>
                    <TableCell>{c.email}</TableCell>
                  </TableRow>
                ))}
                {company.contacts.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Geen contactpersonen</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Contracten</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Naam</TableHead><TableHead>Referentie</TableHead><TableHead>Einddatum</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {company.contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.reference ?? "-"}</TableCell>
                    <TableCell>{c.endDate ? format(new Date(c.endDate), "d MMM yyyy", { locale: nl }) : "-"}</TableCell>
                  </TableRow>
                ))}
                {company.contracts.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Geen contracten</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Tickets</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>#</TableHead><TableHead>Onderwerp</TableHead><TableHead>Status</TableHead><TableHead>Prioriteit</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {company.tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">#{t.number}</TableCell>
                  <TableCell><Link to={`/tickets/${t.id}`} className="hover:underline">{t.subject}</Link></TableCell>
                  <TableCell><Badge variant="secondary" dotColor={t.status.color}>{t.status.name}</Badge></TableCell>
                  <TableCell><Badge variant="outline" dotColor={t.priority.color}>{t.priority.name}</Badge></TableCell>
                </TableRow>
              ))}
              {company.tickets.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Geen tickets</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
