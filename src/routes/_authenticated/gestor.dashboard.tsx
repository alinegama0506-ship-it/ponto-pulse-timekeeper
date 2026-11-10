import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, Hourglass, Users } from "lucide-react";
import { PageHeading, Panel } from "@/components/ponto/PageHeading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { diasAtras, useProfiles, useTodasMarcacoes, useTodasSolicitacoes } from "@/lib/gestor-queries";
import { relogioDivergente } from "@/lib/geo";
import { useRegras } from "@/lib/queries";
import { agruparPorDia, dataLocalHoje, formatarData, formatarMinutos, jornadaCompleta, minutosTrabalhados, saldoBanco } from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/gestor/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ponto Inteligente" }, { name: "description", content: "Indicadores de jornada e banco de horas." }] }),
  component: Dashboard,
});

function Dashboard() {
  const [periodo, setPeriodo] = useState("30");
  const desde = diasAtras(Number(periodo));
  const profiles = useProfiles();
  const marc = useTodasMarcacoes(desde);
  const sol = useTodasSolicitacoes();
  const regras = useRegras();
  const hoje = dataLocalHoje();
  const r = regras.data;
  const ms = marc.data ?? [];
  const ativos = (profiles.data ?? []).filter((p) => p.ativo);
  const dias = [...agruparPorDia(ms).values()];
  const completas = dias.filter(jornadaCompleta).length;
  const acimaLimite = r ? dias.filter((d) => minutosTrabalhados(d) > r.limite_diario_min) : [];
  const foraArea = ms.filter(m => m.geo_status === "fora").length;
  const divergentes = ms.filter(m => relogioDivergente(m.divergencia_relogio_s, r?.divergencia_max_s ?? 300)).length;
  const pendentes = (sol.data ?? []).filter((s) => s.status === "pendente").length;
  const vencimento = r ? diasAtras(r.validade_banco_dias - 15) : "";
  const proxVenc = r ? new Set(ms.filter((m) => m.data_local <= vencimento).map((m) => m.user_id)).size : 0;
  const porColab = r ? ativos.map((p) => ({ p, saldo: saldoBanco(ms.filter((m) => m.user_id === p.id), r) })) : [];
  const consolidado = porColab.reduce((a, b) => a + b.saldo, 0);
  const nome = (id: string) => profiles.data?.find((p) => p.id === id)?.nome ?? "—";

  const kpis = [
    { l: "Colaboradores ativos", v: ativos.length, i: Users },
    { l: "Marcações hoje", v: ms.filter((m) => m.data_local === hoje).length, i: Clock3 },
    { l: "Solicitações pendentes", v: pendentes, i: Hourglass },
    { l: "Saldo consolidado", v: formatarMinutos(consolidado), i: CalendarClock },
    { l: "Jornadas completas", v: `${completas}/${dias.length}`, i: CheckCircle2 },
  ];

  return (
    <>
      <PageHeading eyebrow="Visão gerencial" title="Dashboard" desc="Indicadores de jornada e banco de horas da equipe.">
        <div className="grid gap-1">
          <label htmlFor="periodo" className="text-xs font-semibold text-muted-foreground">Período</label>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger id="periodo" className="h-11 w-44 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="7">Últimos 7 dias</SelectItem><SelectItem value="30">Últimos 30 dias</SelectItem><SelectItem value="90">Últimos 90 dias</SelectItem><SelectItem value="365">Últimos 12 meses</SelectItem></SelectContent>
          </Select>
        </div>
      </PageHeading>
      {marc.isPending && <p role="status" className="mb-4">Carregando indicadores…</p>}
      {(marc.isError || regras.isError || profiles.isError) && <p role="alert" className="mb-4 text-destructive">Não foi possível carregar os indicadores.</p>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map(({ l, v, i: I }) => (
          <div key={l} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">{l}<I className="size-4 text-primary" /></div>
            <div className="tabular mt-2 text-2xl font-extrabold">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Banco de horas por colaborador">
          {porColab.length ? <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Colaborador</th><th className="py-2">Cargo</th><th className="py-2 text-right">Saldo</th></tr></thead>
            <tbody className="divide-y">{porColab.map(({ p, saldo }) => (
              <tr key={p.id}><td className="py-2.5 font-medium">{p.nome}</td><td className="py-2.5 text-muted-foreground">{p.cargo ?? "—"}</td>
                <td className={`tabular py-2.5 text-right font-bold ${saldo < 0 ? "text-destructive" : "text-primary"}`}>{formatarMinutos(saldo)}</td></tr>
            ))}</tbody></table></div> : <p className="text-sm text-muted-foreground">Sem colaboradores.</p>}
        </Panel>
        <Panel title="Alertas">
          <ul className="grid gap-3 text-sm">
            {acimaLimite.slice(0, 6).map((d) => (
              <li key={(d[0]?.user_id ?? "") + (d[0]?.data_local ?? "")} className="flex items-start gap-3 rounded-lg bg-danger-soft p-3 text-danger-soft-foreground">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span><b>{nome((d[0]?.user_id ?? ""))}</b> trabalhou {formatarMinutos(minutosTrabalhados(d), false)} em {formatarData((d[0]?.data_local ?? ""))} (limite {r && formatarMinutos(r.limite_diario_min, false)}).</span>
              </li>
            ))}
            {proxVenc > 0 && <li className="flex items-start gap-3 rounded-lg bg-warning p-3 text-warning-foreground"><Hourglass className="mt-0.5 size-4 shrink-0" />{proxVenc} colaborador(es) com horas próximas do vencimento (15 dias).</li>}
            {foraArea > 0 && <li className="rounded-lg bg-warning p-3 text-warning-foreground"><b>{foraArea}</b> marcações fora da área.</li>}
            {divergentes > 0 && <li className="rounded-lg bg-warning p-3 text-warning-foreground"><b>{divergentes}</b> marcações com relógio divergente.</li>}
            {!acimaLimite.length && !proxVenc && !foraArea && !divergentes && <li className="flex items-center gap-2 text-muted-foreground"><Badge variant="success">OK</Badge>Nenhum alerta no período.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
