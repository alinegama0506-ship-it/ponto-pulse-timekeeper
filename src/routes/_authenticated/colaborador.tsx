import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GeoRegistro } from "@/components/ponto/GeoRegistro";
import { useLocais } from "@/lib/geo-queries";
import { Clock } from "@/components/ponto/Clock";
import { SolicitacaoForm } from "@/components/ponto/SolicitacaoForm";
import { sair, useMe, useRegras } from "@/lib/queries";
import {
  MOTIVO_LABEL, STATUS_LABEL, TIPOS, TIPO_LABEL, agruparPorDia, capturarMomentoLocal, dataLocalHoje,
  formatarData, formatarHora, formatarMinutos, minutosTrabalhados, proximoTipo, saldoBanco, saldoDia,
} from "@/lib/ponto";
import { useNavigate } from "@tanstack/react-router";
import { statusVariant } from "@/lib/gestor-queries";

export const Route = createFileRoute("/_authenticated/colaborador")({
  head: () => ({ meta: [{ title: "Meu ponto — Ponto Inteligente" }, { name: "description", content: "Registre seu ponto e acompanhe seu banco de horas." }] }),
  component: Colaborador,
});


function Colaborador() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const me = useMe();
  const regras = useRegras();
  const uid = me.data?.user.id;
  const locais = useLocais();

  const marc = useQuery({
    queryKey: ["marcacoes", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) throw new Error("Sessão expirada");
      const { data, error } = await supabase.from("marcacoes").select("*").eq("user_id", uid).order("momento_dispositivo", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });
  const sol = useQuery({
    queryKey: ["solicitacoes", uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) throw new Error("Sessão expirada");
      const { data, error } = await supabase.from("solicitacoes").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const hoje = dataLocalHoje();
  const deHoje = (marc.data ?? []).filter((m) => m.data_local === hoje);
  const proximo = proximoTipo(deHoje.map((m) => m.tipo));

  const saldo = regras.data && marc.data ? saldoBanco(marc.data, regras.data) : null;
  const dias = [...agruparPorDia(marc.data ?? []).entries()].slice(0, 14);

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 font-extrabold"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Clock3 className="size-4" /></span><span className="hidden sm:inline">Ponto Inteligente</span></div>
          <div className="flex items-center gap-1">
            {me.data?.isGestor && <Button asChild variant="ghost" size="sm" className="min-h-11"><Link to="/gestor/dashboard"><LayoutDashboard className="size-4" />Gestão</Link></Button>}
            <Button variant="ghost" size="sm" className="min-h-11" onClick={async () => { await sair(qc); nav({ to: "/auth", replace: true }); }}><LogOut className="size-4" />Sair</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-5 px-4 pt-6">
        <p className="text-sm text-muted-foreground">Olá, <b className="text-foreground">{me.data?.profile?.nome ?? "…"}</b></p>
        <section className="rounded-2xl border bg-card p-6 shadow-card">
          <Clock big />
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIPOS.map((t) => {
              const m = deHoje.find((x) => x.tipo === t);
              return (
                <div key={t} className={`rounded-xl border p-3 text-center ${m ? "bg-success" : "bg-muted"}`}>
                  <div className="text-[11px] font-semibold text-muted-foreground">{TIPO_LABEL[t]}</div>
                  <div className="tabular mt-1 text-lg font-bold">{m ? formatarHora(m.momento_dispositivo) : "--:--"}</div>
                  {m && <Badge variant="outline" className="mt-2 whitespace-normal text-[10px]">{m.geo_status === "dentro" ? locais.data?.find(l => l.id === m.local_id)?.nome ?? "Dentro da área" : m.latitude === null ? "Sem localização" : m.geo_status === "dispensado" ? "Dispensado" : "Fora da área"}</Badge>}
                   {m?.origem === "ajuste" && <div className="text-[10px] font-semibold text-success-foreground">ajuste aprovado</div>}
                </div>
              );
            })}
          </div>
          <GeoRegistro tipo={proximo} disabled={!marc.data || marc.isError} />
          {marc.isPending && <p role="status" className="text-sm text-muted-foreground">Carregando marcações…</p>}
          {(marc.isError || regras.isError) && <p role="alert" className="text-sm text-destructive">Não foi possível carregar o ponto ou as regras. <Button variant="outline" className="min-h-11" onClick={() => { void marc.refetch(); void regras.refetch(); }}>Tentar de novo</Button></p>}
          <p className="mt-2 text-center text-xs text-muted-foreground">Usa o horário do seu dispositivo no instante do clique.</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo do banco de horas</div>
            <div className={`tabular mt-1 text-3xl font-extrabold ${saldo !== null && saldo < 0 ? "text-destructive" : "text-primary"}`}>{saldo === null ? "…" : formatarMinutos(saldo)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Solicitações pendentes não alteram o saldo — ele só muda após aprovação do Gestor/RH.</p>
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regras</div>
            {regras.data && <ul className="mt-2 space-y-1 text-sm">
              <li>Jornada diária: <b>{formatarMinutos(regras.data.jornada_diaria_min, false)}</b></li>
              <li>Tolerância: <b>{regras.data.tolerancia_min} min</b></li>
              <li>Validade do banco: <b>{regras.data.validade_banco_dias} dias</b></li>
            </ul>}
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="font-bold">Solicitar ajuste de ponto</h2>
          <p className="mb-4 text-sm text-muted-foreground">Para marcações esquecidas ou com horário incorreto.</p>
          <SolicitacaoForm />
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-bold">Minhas solicitações</h2>
          {sol.data?.length ? <ul className="divide-y">
            {sol.data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm">
                <div>
                  <div className="font-semibold">{TIPO_LABEL[s.tipo]} · {formatarData(s.data_solicitada)} às {s.hora_solicitada.slice(0, 5)}</div>
                  <div className="text-muted-foreground">{MOTIVO_LABEL[s.motivo]}{s.observacao ? ` — ${s.observacao}` : ""}</div>
                  {s.justificativa_rejeicao && <div className="text-xs text-destructive">Justificativa: {s.justificativa_rejeicao}</div>}
                </div>
                <Badge variant={statusVariant[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              </li>
            ))}
          </ul> : <p className="text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>}
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 font-bold">Histórico diário</h2>
          {dias.length ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2">Data</th>{TIPOS.map((t) => <th key={t} className="py-2">{TIPO_LABEL[t].split(" ")[0]}{t.includes("intervalo") ? " int." : ""}</th>)}<th className="py-2">Trabalhado</th><th className="py-2">Saldo</th></tr></thead>
            <tbody className="divide-y">{dias.map(([k, d]) => (
              <tr key={k}><td className="py-2 font-medium">{formatarData(d[0]?.data_local ?? "")}</td>
                {TIPOS.map((t) => { const m = d.find((x) => x.tipo === t); return <td key={t} className="tabular py-2">{m ? formatarHora(m.momento_dispositivo) : "—"}</td>; })}
                <td className="tabular py-2">{formatarMinutos(minutosTrabalhados(d), false)}</td>
                <td className="tabular py-2 font-semibold">{regras.data ? formatarMinutos(saldoDia(d, regras.data)) : ""}</td></tr>
            ))}</tbody></table></div> : <p className="text-sm text-muted-foreground">Sem marcações registradas.</p>}
        </section>
      </main>
    </div>
  );
}
