import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Contact, Ticket } from "@/types";

interface ContactDetail extends Contact {
  tickets: Ticket[];
}

const portalSchema = z.object({ password: z.string().min(8, "Minimaal 8 tekens") });
type PortalFormValues = z.infer<typeof portalSchema>;

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  const { data: contact, isLoading } = useQuery<ContactDetail>({
    queryKey: ["contact", id],
    queryFn: async () => (await api.get(`/contacts/${id}`)).data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PortalFormValues>({
    resolver: zodResolver(portalSchema),
  });

  const createPortalAccount = useMutation({
    mutationFn: async (values: PortalFormValues) => (await api.post(`/contacts/${id}/portal-account`, values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      toast({ title: "Portaalaccount aangemaakt", variant: "success" });
      reset();
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Aanmaken mislukt", description: e?.response?.data?.message, variant: "destructive" }),
  });

  if (isLoading || !contact) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{contact.name}</h1>
          <p className="text-sm text-muted-foreground">{contact.email} {contact.phone && `· ${contact.phone}`}</p>
          {contact.company && (
            <p className="text-sm text-muted-foreground">
              Bedrijf: <Link to={`/companies/${contact.company.id}`} className="hover:underline">{contact.company.name}</Link>
            </p>
          )}
        </div>
        {!contact.user && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Portaalaccount aanmaken</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Portaalaccount aanmaken</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((v) => createPortalAccount.mutate(v))} className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Hiermee kan {contact.name} inloggen op het klantenportaal met e-mailadres {contact.email}.
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>Account aanmaken</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
        {contact.user && <Badge variant={contact.user.isActive ? "default" : "secondary"}>Portaalaccount actief</Badge>}
      </div>

      {contact.notes && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Notities</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{contact.notes}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Tickets</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><TableHead>#</TableHead><TableHead>Onderwerp</TableHead><TableHead>Status</TableHead><TableHead>Prioriteit</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {contact.tickets.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">#{t.number}</TableCell>
                  <TableCell><Link to={`/tickets/${t.id}`} className="hover:underline">{t.subject}</Link></TableCell>
                  <TableCell><Badge variant="secondary" dotColor={t.status.color}>{t.status.name}</Badge></TableCell>
                  <TableCell><Badge variant="outline" dotColor={t.priority.color}>{t.priority.name}</Badge></TableCell>
                </TableRow>
              ))}
              {contact.tickets.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Geen tickets</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
