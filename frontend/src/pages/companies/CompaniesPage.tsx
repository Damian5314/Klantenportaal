import * as React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Company } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function CompaniesPage() {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["companies", search],
    queryFn: async () => (await api.get("/companies", { params: { search: search || undefined } })).data,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const createCompany = useMutation({
    mutationFn: async (values: FormValues) => (await api.post("/companies", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast({ title: "Bedrijf aangemaakt", variant: "success" });
      reset();
      setOpen(false);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bedrijven</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Nieuw bedrijf</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nieuw bedrijf</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit((v) => createCompany.mutate(v))} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Naam</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" {...register("email")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Telefoon</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" {...register("address")} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>Opslaan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Zoeken..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefoon</TableHead>
              <TableHead>Contactpersonen</TableHead>
              <TableHead>Tickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Laden...</TableCell></TableRow>
            )}
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link to={`/companies/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                </TableCell>
                <TableCell>{c.email ?? "-"}</TableCell>
                <TableCell>{c.phone ?? "-"}</TableCell>
                <TableCell>{c._count?.contacts ?? 0}</TableCell>
                <TableCell>{c._count?.tickets ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
