import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { TicketDetail } from "@/types";

export function useTicket(id: string) {
  return useQuery<TicketDetail>({
    queryKey: ["ticket", id],
    queryFn: async () => (await api.get(`/tickets/${id}`)).data,
    enabled: !!id,
  });
}

export function useUpdateTicket(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => (await api.put(`/tickets/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useAddMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body: string; attachmentIds?: string[] }) =>
      (await api.post(`/tickets/${id}/messages`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket", id] }),
  });
}

export function useAddNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { body: string; attachmentIds?: string[] }) =>
      (await api.post(`/tickets/${id}/notes`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket", id] }),
  });
}

export function useAddTimeEntry(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { minutes: number; description?: string }) =>
      (await api.post(`/tickets/${id}/time-entries`, payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ticket", id] }),
  });
}

export async function uploadAttachment(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/attachments", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return data.id as string;
}
