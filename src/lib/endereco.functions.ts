import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizarEnderecos } from "./endereco";

export const localizarEndereco = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ endereco: z.string().trim().min(5).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: gestor, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "gestor" });
    if (error || !gestor) throw new Error("Somente Gestor/RH pode localizar endereços para cadastro.");
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({ q: data.endereco, format: "jsonv2", limit: "4", "accept-language": "pt-BR" }).toString();
    let response: Response;
    try {
      response = await fetch(url, { headers: { "User-Agent": "PontoInteligente/1.0 (https://ponto-pulse-timekeeper.lovable.app)", Accept: "application/json" }, signal: AbortSignal.timeout(12000), redirect: "manual" });
    } catch { throw new Error("Não foi possível buscar o endereço. Tente novamente."); }
    if (!response.ok) throw new Error("Busca de endereços indisponível. Tente novamente em instantes.");
    return normalizarEnderecos(await response.json());
  });