import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/api/client";
import { useTicketCategories, useTicketPriorities, useTicketStatuses, useLabels } from "@/api/ticketConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

function useCreate(path: string, invalidateKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.post(path, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      toast({ title: "Opgeslagen", variant: "success" });
    },
    onError: (e: any) => toast({ title: "Opslaan mislukt", description: e?.response?.data?.message, variant: "destructive" }),
  });
}

function useDelete(pathPrefix: string, invalidateKey: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`${pathPrefix}/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [invalidateKey] }),
    onError: (e: any) => toast({ title: "Verwijderen mislukt", description: e?.response?.data?.message, variant: "destructive" }),
  });
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Ticketinstellingen</h1>
      <Tabs defaultValue="statuses">
        <TabsList>
          <TabsTrigger value="statuses">Statussen</TabsTrigger>
          <TabsTrigger value="priorities">Prioriteiten</TabsTrigger>
          <TabsTrigger value="categories">Categorieën</TabsTrigger>
          <TabsTrigger value="labels">Labels</TabsTrigger>
        </TabsList>
        <TabsContent value="statuses"><StatusesTab /></TabsContent>
        <TabsContent value="priorities"><PrioritiesTab /></TabsContent>
        <TabsContent value="categories"><CategoriesTab /></TabsContent>
        <TabsContent value="labels"><LabelsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatusesTab() {
  const { data: statuses = [] } = useTicketStatuses();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");
  const [isClosed, setIsClosed] = React.useState(false);
  const create = useCreate("/ticket-config/statuses", "ticket-statuses");
  const remove = useDelete("/ticket-config/statuses", "ticket-statuses");

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Ticketstatussen</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {statuses.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-2">
              <Badge variant="secondary" dotColor={s.color}>{s.name}</Badge>
              <div className="flex items-center gap-2">
                {s.isDefault && <Badge variant="outline">Standaard</Badge>}
                {s.isClosed && <Badge variant="outline">Gesloten-status</Badge>}
                <Button variant="ghost" size="icon" onClick={() => remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <Input placeholder="Naam" value={name} onChange={(e) => setName(e.target.value)} className="w-40" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-10 rounded border border-input" />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} /> Gesloten-status
          </label>
          <Button
            size="sm"
            onClick={() => {
              create.mutate({ name, color, isClosed, order: statuses.length });
              setName("");
            }}
            disabled={!name}
          >
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PrioritiesTab() {
  const { data: priorities = [] } = useTicketPriorities();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");
  const create = useCreate("/ticket-config/priorities", "ticket-priorities");
  const remove = useDelete("/ticket-config/priorities", "ticket-priorities");

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Prioriteiten</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          {priorities.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-2">
              <Badge variant="secondary" dotColor={p.color}>{p.name}</Badge>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3">
          <Input placeholder="Naam" value={name} onChange={(e) => setName(e.target.value)} className="w-40" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-10 rounded border border-input" />
          <Button
            size="sm"
            onClick={() => {
              create.mutate({ name, color, order: priorities.length });
              setName("");
            }}
            disabled={!name}
          >
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoriesTab() {
  const { data: categories = [] } = useTicketCategories();
  const [name, setName] = React.useState("");
  const create = useCreate("/ticket-config/categories", "ticket-categories");
  const remove = useDelete("/ticket-config/categories", "ticket-categories");

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Categorieën</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          {topLevel.map((cat) => (
            <div key={cat.id} className="rounded-md border border-border p-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{cat.name}</span>
                <Button variant="ghost" size="icon" onClick={() => remove.mutate(cat.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1 pl-3">
                {childrenOf(cat.id).map((child) => (
                  <Badge key={child.id} variant="outline">{child.name}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <Input placeholder="Nieuwe hoofdcategorie" value={name} onChange={(e) => setName(e.target.value)} className="w-56" />
          <Button
            size="sm"
            onClick={() => {
              create.mutate({ name });
              setName("");
            }}
            disabled={!name}
          >
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LabelsTab() {
  const { data: labels = [] } = useLabels();
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");
  const create = useCreate("/ticket-config/labels", "labels");
  const remove = useDelete("/ticket-config/labels", "labels");

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Labels</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {labels.map((l) => (
            <div key={l.id} className="flex items-center gap-1">
              <Badge variant="secondary" dotColor={l.color}>{l.name}</Badge>
              <button onClick={() => remove.mutate(l.id)}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
        <div className="flex items-end gap-2 border-t border-border pt-3">
          <Input placeholder="Naam" value={name} onChange={(e) => setName(e.target.value)} className="w-40" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-10 rounded border border-input" />
          <Button
            size="sm"
            onClick={() => {
              create.mutate({ name, color });
              setName("");
            }}
            disabled={!name}
          >
            <Plus className="h-4 w-4" /> Toevoegen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
