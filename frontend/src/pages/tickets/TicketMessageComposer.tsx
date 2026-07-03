import * as React from "react";
import { Paperclip, Send, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { uploadAttachment } from "@/api/tickets";
import { toast } from "@/hooks/use-toast";

interface Props {
  placeholder: string;
  submitLabel: string;
  onSubmit: (payload: { body: string; attachmentIds: string[] }) => Promise<unknown>;
  variant?: "default" | "note";
}

export function TicketMessageComposer({ placeholder, submitLabel, onSubmit, variant = "default" }: Props) {
  const [body, setBody] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      const attachmentIds = await Promise.all(files.map(uploadAttachment));
      await onSubmit({ body, attachmentIds });
      setBody("");
      setFiles([]);
    } catch (e: any) {
      toast({ title: "Versturen mislukt", description: e?.response?.data?.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={variant === "note" ? "rounded-md border border-amber-400/50 bg-amber-50 p-3 dark:bg-amber-950/30" : ""}>
      <Textarea
        placeholder={placeholder}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className={variant === "note" ? "bg-transparent" : ""}
      />
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span key={i} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
              {f.name}
              <button onClick={() => setFiles((fs) => fs.filter((_, idx) => idx !== i))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} type="button">
          <Paperclip className="h-4 w-4" /> Bijlage
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => setFiles((fs) => [...fs, ...Array.from(e.target.files ?? [])])}
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !body.trim()} size="sm">
          <Send className="h-4 w-4" /> {submitLabel}
        </Button>
      </div>
    </div>
  );
}
