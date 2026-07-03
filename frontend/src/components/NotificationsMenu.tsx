import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { api } from "@/api/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/types";

export function NotificationsMenu({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<AppNotification[]>({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    await api.post("/notifications/mark-all-read");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function openNotification(n: AppNotification) {
    if (!n.isRead) {
      await api.post(`/notifications/${n.id}/read`);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (n.link) navigate(n.link);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-destructive" />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Meldingen
          {unreadCount > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllRead}>
              Alles gelezen
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 && <p className="px-2 py-4 text-center text-sm text-muted-foreground">Geen meldingen</p>}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => openNotification(n)}
              className={`flex w-full flex-col gap-0.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent ${!n.isRead ? "bg-accent/50" : ""}`}
            >
              <span className="font-medium">{n.title}</span>
              {n.body && <span className="truncate text-xs text-muted-foreground">{n.body}</span>}
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: nl })}
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
