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
import type { Regras } from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/gestor/regras")({
  head: () => ({ meta: [{ title: "Regras e transparência — Ponto Inteligente" }, { name: "description", content: "Tolerância, limite diário e validade do banco de horas." }] }),
  component: RegrasPage,
});

const CAMPOS: { k: keyof Regras; l: string; d: string }[] = [
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
      if (!v || Object.values(v).some((x) => !Number.isInteger(x) || x < 0)) throw new Error("Informe valores inteiros positivos.");
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
          {v && <form onSubmit={(e) => { e.preventDefault(); salvar.mutate(); }} className="grid gap-4 sm:grid-cols-2">
            {CAMPOS.map(({ k, l, d }) => (
              <div key={k} className="grid gap-1.5"><Label htmlFor={k}>{l}</Label>
                <Input id={k} type="number" min={0} className="h-11" value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} aria-describedby={`${k}-d`} />
                <p id={`${k}-d`} className="text-xs text-muted-foreground">{d}</p></div>
            ))}
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
