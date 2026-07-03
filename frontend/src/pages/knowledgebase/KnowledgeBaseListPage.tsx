import * as React from "react";
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { KbArticle, KbCategory } from "@/types";

const schema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  content: z.string().min(1, "Inhoud is verplicht"),
  categoryId: z.string().optional(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]),
});
type FormValues = z.infer<typeof schema>;

export function KnowledgeBaseListPage() {
  const { hasPermission, user } = useAuth();
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const canManage = user?.kind === "STAFF" && hasPermission(PERMISSIONS.KB_MANAGE);

  const { data: articles = [], isLoading } = useQuery<KbArticle[]>({
    queryKey: ["kb-articles", search],
    queryFn: async () => (await api.get("/knowledgebase/articles", { params: { search: search || undefined } })).data,
  });
  const { data: categories = [] } = useQuery<KbCategory[]>({
    queryKey: ["kb-categories"],
    queryFn: async () => (await api.get("/knowledgebase/categories")).data,
  });

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: "INTERNAL" },
  });

  const createArticle = useMutation({
    mutationFn: async (values: FormValues) => (await api.post("/knowledgebase/articles", values)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kb-articles"] });
      toast({ title: "Artikel aangemaakt", variant: "success" });
      reset();
      setOpen(false);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Kennisbank</h1>
          <p className="text-sm text-muted-foreground">{articles.length} artikelen</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> Nieuw artikel</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nieuw kennisbankartikel</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit((v) => createArticle.mutate(v))} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="title">Titel</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="content">Inhoud (Markdown)</Label>
                  <Textarea id="content" rows={10} {...register("content")} />
                  {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Categorie</Label>
                    <Controller
                      control={control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue placeholder="Geen categorie" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Zichtbaarheid</Label>
                    <Controller
                      control={control}
                      name="visibility"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INTERNAL">Intern</SelectItem>
                            <SelectItem value="PUBLIC">Publiek</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>Opslaan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Zoeken in kennisbank..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Laden...</p>}
        {articles.map((a) => (
          <Link key={a.id} to={`/knowledgebase/${a.slug}`}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle className="text-base">{a.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-1">
                {a.category && <Badge variant="outline">{a.category.name}</Badge>}
                {a.visibility === "INTERNAL" && <Badge variant="secondary">Intern</Badge>}
                {a.tags.map((t) => (
                  <Badge key={t.id} variant="outline">{t.name}</Badge>
                ))}
              </CardContent>
            </Card>
          </Link>
        ))}
        {!isLoading && articles.length === 0 && <p className="text-sm text-muted-foreground">Geen artikelen gevonden</p>}
      </div>
    </div>
  );
}
