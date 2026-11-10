import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Regras } from "./ponto";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sessão expirada");
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      const r = (roles ?? []).map((x) => x.role);
      return { user: u.user, profile, isGestor: r.includes("gestor") };
    },
  });
}

export function useRegras() {
  return useQuery({
    queryKey: ["regras"],
    queryFn: async (): Promise<Regras> => {
      const { data, error } = await supabase.from("regras").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}

/** Device clock, refreshed every second. Null until mounted (avoids SSR mismatch). */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function iniciais(nome?: string | null) {
  return (nome ?? "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export async function sair(qc: { cancelQueries: () => Promise<void>; clear: () => void }) {
  await qc.cancelQueries();
  qc.clear();
  await supabase.auth.signOut();
}
