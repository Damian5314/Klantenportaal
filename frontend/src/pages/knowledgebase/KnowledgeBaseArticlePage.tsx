import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { api } from "@/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KbArticle } from "@/types";

export function KnowledgeBaseArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useQuery<KbArticle>({
    queryKey: ["kb-article", slug],
    queryFn: async () => (await api.get(`/knowledgebase/articles/${slug}`)).data,
  });

  if (isLoading || !article) return <p className="text-sm text-muted-foreground">Laden...</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            {article.category && <Badge variant="outline">{article.category.name}</Badge>}
            {article.tags.map((t) => (
              <Badge key={t.id} variant="outline">{t.name}</Badge>
            ))}
            {article.visibility === "INTERNAL" && <Badge variant="secondary">Intern</Badge>}
          </div>
          <CardTitle className="text-2xl">{article.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Door {article.author.name} · bijgewerkt {format(new Date(article.updatedAt), "d MMM yyyy", { locale: nl })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
