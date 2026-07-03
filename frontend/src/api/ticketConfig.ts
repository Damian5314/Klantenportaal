import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { Label, TicketCategory, TicketPriority, TicketStatus } from "@/types";

export function useTicketStatuses() {
  return useQuery<TicketStatus[]>({
    queryKey: ["ticket-statuses"],
    queryFn: async () => (await api.get("/ticket-config/statuses")).data,
  });
}

export function useTicketPriorities() {
  return useQuery<TicketPriority[]>({
    queryKey: ["ticket-priorities"],
    queryFn: async () => (await api.get("/ticket-config/priorities")).data,
  });
}

export function useTicketCategories() {
  return useQuery<TicketCategory[]>({
    queryKey: ["ticket-categories"],
    queryFn: async () => (await api.get("/ticket-config/categories")).data,
  });
}

export function useLabels() {
  return useQuery<Label[]>({
    queryKey: ["labels"],
    queryFn: async () => (await api.get("/ticket-config/labels")).data,
  });
}
