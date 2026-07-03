import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Verplicht"),
    newPassword: z.string().min(8, "Minimaal 8 tekens"),
    confirmPassword: z.string().min(1, "Verplicht"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Wachtwoorden komen niet overeen",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function ProfilePage() {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast({ title: "Wachtwoord gewijzigd", variant: "success" });
      reset();
    } catch (e: any) {
      toast({ title: "Wijzigen mislukt", description: e?.response?.data?.message, variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Mijn profiel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Naam: </span>
            {user?.name}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {user?.email}
          </p>
          <p>
            <span className="text-muted-foreground">Rol: </span>
            {user?.roleName}
          </p>
          {user?.contact?.company && (
            <p>
              <span className="text-muted-foreground">Bedrijf: </span>
              {user.contact.company.name}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wachtwoord wijzigen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Huidig wachtwoord</Label>
              <Input id="currentPassword" type="password" {...register("currentPassword")} />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
              <Input id="newPassword" type="password" {...register("newPassword")} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Bevestig nieuw wachtwoord</Label>
              <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="self-start">
              Wachtwoord bijwerken
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
