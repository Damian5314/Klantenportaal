import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { useTicketCategories, useTicketPriorities } from "@/api/ticketConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { Contact } from "@/types";

const schema = z.object({
  subject: z.string().min(3, "Onderwerp is verplicht"),
  description: z.string().min(5, "Beschrijving is verplicht"),
  priorityId: z.string().min(1, "Verplicht"),
  categoryId: z.string().optional(),
  contactId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function NewTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: priorities = [] } = useTicketPriorities();
  const { data: categories = [] } = useTicketCategories();

  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["contacts", "picker"],
    queryFn: async () => (await api.get("/contacts")).data,
    enabled: user?.kind === "STAFF",
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const { data } = await api.post("/tickets", values);
      toast({ title: "Ticket aangemaakt", variant: "success" });
      navigate(`/tickets/${data.id}`);
    } catch (e: any) {
      toast({ title: "Aanmaken mislukt", description: e?.response?.data?.message, variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Nieuw ticket aanmaken</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {user?.kind === "STAFF" && (
              <div className="flex flex-col gap-1.5">
                <Label>Klant</Label>
                <Controller
                  control={control}
                  name="contactId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Kies een klant" /></SelectTrigger>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — {c.email} {c.company ? `(${c.company.name})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subject">Onderwerp</Label>
              <Input id="subject" {...register("subject")} />
              {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea id="description" rows={6} {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Prioriteit</Label>
                <Controller
                  control={control}
                  name="priorityId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Kies prioriteit" /></SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priorityId && <p className="text-xs text-destructive">{errors.priorityId.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Categorie</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="self-start">
              Ticket aanmaken
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
