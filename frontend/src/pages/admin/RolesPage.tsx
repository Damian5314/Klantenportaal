import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Permission, Role } from "@/types";

export function RolesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedPermissions, setSelectedPermissions] = React.useState<string[]>([]);

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => (await api.get("/roles")).data,
  });
  const { data: permissions = [] } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: async () => (await api.get("/roles/permissions")).data,
  });

  function openCreate() {
    setEditingRole(null);
    setName("");
    setDescription("");
    setSelectedPermissions([]);
    setOpen(true);
  }

  function openEdit(role: Role) {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description ?? "");
    setSelectedPermissions(role.permissions.map((p) => p.key));
    setOpen(true);
  }

  const saveRole = useMutation({
    mutationFn: async () => {
      const payload = { name, description, permissionKeys: selectedPermissions };
      if (editingRole) return (await api.put(`/roles/${editingRole.id}`, payload)).data;
      return (await api.post("/roles", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({ title: "Rol opgeslagen", variant: "success" });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Opslaan mislukt", description: e?.response?.data?.message, variant: "destructive" }),
  });

  function togglePermission(key: string) {
    setSelectedPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rollen &amp; rechten</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nieuwe rol</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingRole ? "Rol bewerken" : "Nieuwe rol"}</DialogTitle></DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-name">Naam</Label>
                <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} disabled={editingRole?.isSystem} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-description">Omschrijving</Label>
                <Input id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Rechten</Label>
                <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-md border border-border p-2 sm:grid-cols-2">
                  {permissions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(p.key)}
                        onChange={() => togglePermission(p.key)}
                      />
                      {p.key}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => saveRole.mutate()} disabled={!name}>Opslaan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                {role.name}
                {role.isSystem && <Badge variant="outline">Systeem</Badge>}
              </CardTitle>
              {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{role._count?.users ?? 0} gebruiker(s) · {role.permissions.length} rechten</p>
              <Button variant="outline" size="sm" onClick={() => openEdit(role)}>Bewerken</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
