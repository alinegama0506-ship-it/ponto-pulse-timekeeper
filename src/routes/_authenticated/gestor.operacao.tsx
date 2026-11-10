import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Download, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeading, Panel } from "@/components/ponto/PageHeading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { diasAtras, statusVariant, useProfiles, useTodasMarcacoes, useTodasSolicitacoes } from "@/lib/gestor-queries";
import { GEO_LABEL, relogioDivergente } from "@/lib/geo";
import { useLocais } from "@/lib/geo-queries";
import { useRegras } from "@/lib/queries";
import { useMe } from "@/lib/queries";
import { MOTIVO_LABEL, STATUS_LABEL, TIPOS, TIPO_LABEL, formatarData, formatarHora } from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/gestor/operacao")({
  head: () => ({ meta: [{ title: "Operação — Ponto Inteligente" }, { property: "og:title", content: "Operação — Ponto Inteligente" }, { property: "og:description", content: "Aprovação de ajustes e consulta de marcações." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Aprovação de ajustes e consulta de marcações." }] }),
  component: Operacao,
});

type Decisao = { id: string; aprovar: boolean; resumo: string } | null;

function Operacao() {
  const qc = useQueryClient();
  const me = useMe();
  const profiles = useProfiles();
  const locais = useLocais(); const regras = useRegras();
  const [geoFiltro,setGeoFiltro] = useState("todos"); const [localFiltro,setLocalFiltro] = useState("todos");
  const sol = useTodasSolicitacoes();
  const [colab, setColab] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [status, setStatus] = useState("pendente");
  const [de, setDe] = useState(diasAtras(30));
  const [ate, setAte] = useState("");
  const marc = useTodasMarcacoes(de || diasAtras(365));
  const [dec, setDec] = useState<Decisao>(null);
  const [just, setJust] = useState("");
  const nome = (id?: string | null) => (id ? profiles.data?.find((p) => p.id === id)?.nome ?? "—" : "—");

  const filtra = <T extends { user_id: string; tipo: string }>(rows: T[], data: (r: T) => string) =>
    rows.filter((r) => (colab === "todos" || r.user_id === colab) && (tipo === "todos" || r.tipo === tipo) && (!de || data(r) >= de) && (!ate || data(r) <= ate));

  const solicitacoes = useMemo(() => filtra(sol.data ?? [], (s) => s.data_solicitada).filter((s) => status === "todos" || s.status === status), [sol.data, colab, tipo, status, de, ate]);
  const marcacoes = useMemo(() => filtra(marc.data ?? [], (m) => m.data_local).filter(m => (geoFiltro === "todos" || m.geo_status === geoFiltro) && (localFiltro === "todos" || m.local_id === localFiltro)), [marc.data, colab, tipo, de, ate, geoFiltro, localFiltro]);

  const decidir = useMutation({
    mutationFn: async (d: NonNullable<Decisao>) => {
      const { error } = await supabase.rpc("decidir_solicitacao", { _id: d.id, _aprovar: d.aprovar, ...(just ? { _justificativa: just } : {}) });
      if (error) throw error;
    },
    onSuccess: (_, d) => {
      toast.success(d.aprovar ? "Solicitação aprovada e marcação registrada." : "Solicitação rejeitada.");
      setDec(null); setJust("");
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["marcacoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportar = () => {
    const linhas = [["Colaborador", "Data", "Tipo", "Hora", "Origem", "Fuso (min)", "Registrado no servidor", "Latitude", "Longitude", "Precisão (m)", "Distância (m)", "Status geo", "Local", "Divergência (s)", "Justificativa geo"],
      ...marcacoes.map((m) => [nome(m.user_id), m.data_local, TIPO_LABEL[m.tipo], m.hora_local, m.origem, String(m.tz_offset_min), m.created_at, m.latitude ?? "", m.longitude ?? "", m.precisao_m ?? "", m.distancia_m ?? "", m.geo_status, locais.data?.find(l=>l.id===m.local_id)?.nome ?? "", m.divergencia_relogio_s ?? "", m.geo_justificativa ?? ""])];
    const csv = linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" }));
    a.download = `marcacoes-${de || "inicio"}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeading eyebrow="Execução" title="Operação" desc="Fila de ajustes, consulta de marcações e histórico." />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid gap-1"><Label htmlFor="f-colab">Colaborador</Label>
            <Select value={colab} onValueChange={setColab}><SelectTrigger id="f-colab" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{profiles.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1"><Label htmlFor="f-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}><SelectTrigger id="f-tipo" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{TIPOS.map((t) => <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1"><Label htmlFor="f-status">Status</Label>
            <Select value={status} onValueChange={setStatus}><SelectTrigger id="f-status" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent></Select></div>
          <div className="grid gap-1"><Label htmlFor="f-de">De</Label><Input id="f-de" type="date" className="h-11" value={de} onChange={(e) => setDe(e.target.value)} /></div>
          <div className="grid gap-1"><Label htmlFor="f-ate">Até</Label><Input id="f-ate" type="date" className="h-11" value={ate} onChange={(e) => setAte(e.target.value)} /></div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="grid gap-1"><Label htmlFor="f-geo">Status da localização</Label><Select value={geoFiltro} onValueChange={setGeoFiltro}><SelectTrigger id="f-geo" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{Object.entries(GEO_LABEL).map(([k,l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-1"><Label htmlFor="f-local">Local</Label><Select value={localFiltro} onValueChange={setLocalFiltro}><SelectTrigger id="f-local" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{locais.data?.map(l => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent></Select></div></div>
      {(marc.isPending || sol.isPending) && <p role="status" className="mt-4">Carregando operação…</p>}
      {(marc.isError || sol.isError) && <p role="alert" className="mt-4 text-destructive">Não foi possível carregar a operação. <Button className="min-h-11" variant="outline" onClick={() => { void marc.refetch(); void sol.refetch(); }}>Tentar de novo</Button></p>}
      <div className="mt-6 grid gap-6">
        <Panel title={`Solicitações de ajuste (${solicitacoes.length})`}>
          {solicitacoes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2">Colaborador</th><th>Tipo</th><th>Data</th><th>Horário</th><th>Motivo</th><th>Observação</th><th>Status / decisão</th><th className="text-right">Ações</th></tr></thead>
            <tbody className="divide-y">{solicitacoes.map((s) => {
              const propria = s.user_id === me.data?.user.id;
              const resumo = `${nome(s.user_id)} — ${TIPO_LABEL[s.tipo]} em ${formatarData(s.data_solicitada)} às ${s.hora_solicitada.slice(0, 5)}`;
              return (
                <tr key={s.id} className="align-top">
                  <td className="py-3 font-medium">{nome(s.user_id)}</td>
                  <td className="py-3">{TIPO_LABEL[s.tipo]}</td>
                  <td className="tabular py-3">{formatarData(s.data_solicitada)}</td>
                  <td className="tabular py-3">{s.hora_solicitada.slice(0, 5)}</td>
                  <td className="py-3">{MOTIVO_LABEL[s.motivo]}</td>
                  <td className="max-w-[220px] py-3 text-muted-foreground">{s.observacao || "—"}</td>
                  <td className="py-3"><Badge variant={statusVariant[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                    {s.decidido_em && <div className="mt-1 text-xs text-muted-foreground">por {nome(s.decidido_por)} em {new Date(s.decidido_em).toLocaleString("pt-BR")}</div>}
                    {s.justificativa_rejeicao && <div className="text-xs text-destructive">{s.justificativa_rejeicao}</div>}</td>
                  <td className="py-3 text-right">{s.status === "pendente" && (propria
                    ? <span className="text-xs text-muted-foreground">Própria solicitação</span>
                    : <div className="flex justify-end gap-2">
                        <Button size="sm" className="min-h-11" onClick={() => setDec({ id: s.id, aprovar: true, resumo })}><Check className="size-4" />Aprovar</Button>
                        <Button size="sm" variant="outline" className="min-h-11" onClick={() => setDec({ id: s.id, aprovar: false, resumo })}><X className="size-4" />Rejeitar</Button>
                      </div>)}</td>
                </tr>
              );
            })}</tbody></table></div> : <p className="text-sm text-muted-foreground">Nenhuma solicitação com esses filtros.</p>}
        </Panel>

        <Panel title={`Marcações e histórico (${marcacoes.length})`} action={<Button variant="outline" size="sm" className="min-h-11" onClick={exportar} disabled={!marcacoes.length}><Download className="size-4" />Exportar CSV</Button>}>
          {marcacoes.length ? <div className="max-h-[480px] overflow-auto"><table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 bg-card"><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Colaborador</th><th>Data</th><th>Tipo</th><th>Hora (dispositivo)</th><th>Origem</th><th>Registrado no servidor</th><th>Localização</th><th>Local</th><th>Divergência</th></tr></thead>
            <tbody className="divide-y">{marcacoes.map((m) => (
              <tr key={m.id}><td className="py-2.5 font-medium">{nome(m.user_id)}</td><td className="tabular">{formatarData(m.data_local)}</td><td>{TIPO_LABEL[m.tipo]}</td>
                <td className="tabular">{m.hora_local.slice(0, 5)}</td>
                <td>{m.origem === "ajuste" ? <Badge variant="secondary">Ajuste · {nome(m.aprovado_por)}</Badge> : <Badge variant="outline">App</Badge>}</td>
                <td className="tabular text-muted-foreground">{formatarData(m.created_at.slice(0, 10))} {formatarHora(m.created_at)}</td><td><Badge variant={m.geo_status === "dentro" || m.geo_status === "dispensado" ? "outline" : "warning"}>{GEO_LABEL[m.geo_status as keyof typeof GEO_LABEL]}</Badge>{m.geo_justificativa && <p className="max-w-48 whitespace-normal text-xs">{m.geo_justificativa}</p>}</td><td>{locais.data?.find(l => l.id===m.local_id)?.nome ?? "—"}{m.distancia_m !== null && <p className="text-xs">~{Math.round(m.distancia_m)} m</p>}</td><td>{m.divergencia_relogio_s === null ? "—" : <Badge variant={relogioDivergente(m.divergencia_relogio_s,regras.data?.divergencia_max_s ?? 300) ? "warning" : "outline"}>{relogioDivergente(m.divergencia_relogio_s,regras.data?.divergencia_max_s ?? 300) ? "Relógio divergente · " : ""}{Math.round(m.divergencia_relogio_s)} s</Badge>}</td></tr>
            ))}</tbody></table></div> : <p className="text-sm text-muted-foreground">Nenhuma marcação no período.</p>}
        </Panel>
      </div>

      <AlertDialog open={!!dec} onOpenChange={(o) => { if (!o) { setDec(null); setJust(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dec?.aprovar ? "Aprovar solicitação?" : "Rejeitar solicitação?"}</AlertDialogTitle>
            <AlertDialogDescription>{dec?.resumo}. {dec?.aprovar ? "A marcação será registrada com origem ajuste e o saldo será recalculado." : "O saldo não será alterado."}</AlertDialogDescription>
          </AlertDialogHeader>
          {dec && !dec.aprovar && <div className="grid gap-1.5"><Label htmlFor="just">Justificativa da rejeição</Label><Textarea id="just" value={just} onChange={(e) => setJust(e.target.value)} maxLength={500} /></div>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={decidir.isPending} onClick={(e) => { e.preventDefault(); if (dec) decidir.mutate(dec); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
