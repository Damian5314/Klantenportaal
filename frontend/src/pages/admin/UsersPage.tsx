import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { Role, StaffUser } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email(),
  password: z.string().min(8, "Minimaal 8 tekens"),
  roleId: z.string().min(1, "Kies een rol"),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function UsersPage() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["users", "admin"],
    queryFn: async () => (await api.get("/users")).data,
  });
  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => (await api.get("/roles")).data,
  });

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const createUser = useMutation({
    mutationFn: async (values: FormValues) => (await api.post("/users", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Gebruiker aangemaakt", variant: "success" });
      reset();
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Aanmaken mislukt", description: e?.response?.data?.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.put(`/users/${id}`, { isActive })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gebruikers</h1>
          <p className="text-sm text-muted-foreground">Beheerders en medewerkers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/roles">Rollen beheren</Link>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Nieuwe gebruiker</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nieuwe gebruiker</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((v) => createUser.mutate(v))} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Naam</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" {...register("email")} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input id="password" type="password" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Rol</Label>
                  <Controller
                    control={control}
                    name="roleId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Kies een rol" /></SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="department">Afdeling</Label>
                    <Input id="department" {...register("department")} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="jobTitle">Functie</Label>
                    <Input id="jobTitle" {...register("jobTitle")} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>Opslaan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Naam</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Afdeling</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Laden...</TableCell></TableRow>
            )}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role.name}</TableCell>
                <TableCell>{u.department ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={u.isActive ? "default" : "secondary"}>{u.isActive ? "Actief" : "Inactief"}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                  >
                    {u.isActive ? "Deactiveren" : "Activeren"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
