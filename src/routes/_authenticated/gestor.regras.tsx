import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel } from "@/components/ponto/PageHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegras } from "@/lib/queries";
import type { Database } from "@/integrations/supabase/types";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
type Regras = Database["public"]["Tables"]["regras"]["Row"];

export const Route = createFileRoute("/_authenticated/gestor/regras")({
  head: () => ({ meta: [{ title: "Regras e transparência — Ponto Inteligente" }, { property: "og:title", content: "Regras e transparência — Ponto Inteligente" }, { property: "og:description", content: "Tolerância, limite diário e validade do banco de horas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Tolerância, limite diário e validade do banco de horas." }] }),
  component: RegrasPage,
});

const CAMPOS: { k: "jornada_diaria_min" | "tolerancia_min" | "limite_diario_min" | "validade_banco_dias" | "precisao_max_m" | "divergencia_max_s"; l: string; d: string }[] = [
  { k: "precisao_max_m", l: "Precisão máxima (m)", d: "Acima deste valor, a posição tem precisão baixa e segue o modo de localização." },
  { k: "divergencia_max_s", l: "Divergência do relógio (s)", d: "Diferenças absolutas acima deste limite geram um alerta, sem alterar a hora do dispositivo." },
  { k: "jornada_diaria_min", l: "Jornada diária (min)", d: "Base para cálculo do saldo diário." },
  { k: "tolerancia_min", l: "Tolerância (min)", d: "Diferenças dentro dessa margem não geram saldo." },
  { k: "limite_diario_min", l: "Limite diário (min)", d: "Jornadas acima geram alerta no Dashboard." },
  { k: "validade_banco_dias", l: "Validade do banco (dias)", d: "Horas mais antigas são sinalizadas como próximas do vencimento." },
];

function RegrasPage() {
  const qc = useQueryClient();
  const regras = useRegras();
  const [v, setV] = useState<Regras | null>(null);
  useEffect(() => { if (regras.data) setV(regras.data); }, [regras.data]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!v || CAMPOS.some(({ k }) => !Number.isInteger(v[k]) || v[k] < 0) || v.precisao_max_m <= 0) throw new Error("Informe valores inteiros positivos.");
      const { error } = await supabase.from("regras").update({ ...v, atualizado_em: new Date().toISOString() }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Regras atualizadas."); qc.invalidateQueries({ queryKey: ["regras"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeading eyebrow="Transparência" title="Regras e transparência" desc="Parâmetros visíveis para todos os colaboradores." />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Parâmetros">
          {regras.isPending && <p role="status">Carregando regras…</p>}
          {regras.isError && <p role="alert">Não foi possível carregar as regras. <Button variant="outline" className="min-h-11" onClick={() => void regras.refetch()}>Tentar de novo</Button></p>}
          {v && <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(); }} className="grid gap-4 sm:grid-cols-2">
            {CAMPOS.map(({ k, l, d }) => (
              <div key={k} className="grid gap-1.5"><Label htmlFor={k}>{l}</Label>
                <Input id={k} type="number" min={0} className="h-11" value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} aria-describedby={`${k}-d`} />
                <p id={`${k}-d`} className="text-xs text-muted-foreground">{d}</p></div>
            ))}
            <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="geo-modo">Modo de localização</Label><Select value={v.geo_modo} onValueChange={geo_modo => setV({ ...v, geo_modo })}><SelectTrigger id="geo-modo" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bloquear">Bloquear</SelectItem><SelectItem value="justificar">Exigir justificativa</SelectItem><SelectItem value="apenas_registrar">Apenas registrar</SelectItem></SelectContent></Select><p className="text-xs text-muted-foreground">Bloquear recusa posições fora da área, imprecisas ou ausentes. Justificar exige ao menos 10 caracteres. Apenas registrar aceita sem justificativa. Externo e remoto não são bloqueados.</p></div>
            <div className="grid gap-1.5 sm:col-span-2"><Label htmlFor="geo-aviso">Aviso de transparência da localização</Label><Textarea id="geo-aviso" rows={6} minLength={10} maxLength={2000} required value={v.geo_aviso} onChange={e => setV({ ...v, geo_aviso:e.target.value })} /><p className="text-xs text-muted-foreground">Informe finalidade, coleta pontual, quem consulta e prazo real de guarda. Não há exclusão automática de marcações.</p></div>
            <div className="sm:col-span-2"><Button type="submit" className="h-11" disabled={salvar.isPending}>Salvar regras</Button></div>
          </form>}
        </Panel>
        <Panel title="Como o horário é registrado">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>A marcação grava a data e hora do dispositivo no instante do clique, com o fuso horário.</li>
            <li>O servidor grava separadamente o próprio horário de recebimento, para auditoria.</li>
            <li>A hora do dispositivo pode estar incorreta ou ser alterada pelo usuário; diferenças podem ser conferidas na Operação.</li>
            <li>Ajustes só alteram o saldo após aprovação, com registro de quem decidiu e quando.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
