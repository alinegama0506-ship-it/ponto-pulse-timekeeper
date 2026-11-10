import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const statusVariant = { pendente: "warning", aprovado: "success", rejeitado: "danger" } as const;

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useTodasMarcacoes(desde: string) {
  return useQuery({
    queryKey: ["marcacoes", "todas", desde],
    queryFn: async () => {
      const { data, error } = await supabase.from("marcacoes").select("*").gte("data_local", desde).order("momento_dispositivo", { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
  });
}

export function useTodasSolicitacoes() {
  return useQuery({
    queryKey: ["solicitacoes", "todas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("solicitacoes").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
}

export function diasAtras(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
