import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
export function useLocais() { return useQuery({ queryKey: ["locais"], queryFn: async () => { const { data, error } = await supabase.from("locais_trabalho").select("*").order("nome"); if (error) throw error; return data; } }); }
export function useVinculos() { return useQuery({ queryKey: ["vinculos"], queryFn: async () => { const { data, error } = await supabase.from("colaborador_locais").select("*"); if (error) throw error; return data; } }); }