import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { statusVariant, useProfiles, useTodasMarcacoes, useTodasSolicitacoes, useVinculosGestao } from "@/lib/gestor-queries";
import { GEO_LABEL, relogioDivergente } from "@/lib/geo";
import { useLocais } from "@/lib/geo-queries";
import { useRegras } from "@/lib/queries";
import { useMe } from "@/lib/queries";
import { Checkbox } from '@/components/ui/checkbox';
import { FiltrosGestao } from '@/components/ponto/FiltrosGestao';
import { validarFiltrosGestao, useFiltrosGestao } from '@/lib/gestao-filtros';
import { exportarGestao } from '@/lib/gestao-export';
import { useNow } from '@/lib/queries';
import { agruparPorDia, jornadaCompleta, minutosTrabalhados, saldoDia, slaSolicitacoes } from '@/lib/ponto';
import { MOTIVO_LABEL, STATUS_LABEL, TIPOS, TIPO_LABEL, formatarData, formatarHora } from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/gestor/operacao")({
  validateSearch: validarFiltrosGestao,
  head: () => ({ meta: [{ title: "Operação — Ponto Inteligente" }, { property: "og:title", content: "Operação — Ponto Inteligente" }, { property: "og:description", content: "Aprovação de ajustes e consulta de marcações." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Aprovação de ajustes e consulta de marcações." }] }),
  component: Operacao,
});

type Decisao = { ids: string[]; aprovar: boolean; resumo: string } | null;

function Operacao() {
  const qc = useQueryClient();
  const me = useMe();
  const profiles = useProfiles();
  const locais = useLocais(); const regras = useRegras();
  const {value:f,onChange}=useFiltrosGestao('/gestor/operacao');
  const {de,ate,colab,status}=f;const vinculos=useVinculosGestao();const agora=useNow();
  const [geoFiltro,setGeoFiltro] = useState("todos");
  const sol = useTodasSolicitacoes(de,ate);
  const [tipo, setTipo] = useState("todos");
  const marc = useTodasMarcacoes(de,ate);
  const [dec, setDec] = useState<Decisao>(null);
  const [just, setJust] = useState("");const [selecionadas,setSelecionadas]=useState<string[]>([]);const [exportando,setExportando]=useState(false);
  const nome = (id?: string | null) => (id ? profiles.data?.find((p) => p.id === id)?.nome ?? "—" : "—");
  const ids=new Set((profiles.data??[]).filter(p=>(f.equipe==='todos'||(f.equipe==='sem'?!p.equipe_id:p.equipe_id===f.equipe))&&(f.local==='todos'||vinculos.data?.some(v=>v.user_id===p.id&&v.local_id===f.local)||marc.data?.some(m=>m.user_id===p.id&&m.local_id===f.local))).map(p=>p.id));
  const filtra = <T extends { user_id: string; tipo: string }>(rows: T[]) => rows.filter(r=>ids.has(r.user_id)&&(colab==='todos'||r.user_id===colab)&&(tipo==='todos'||r.tipo===tipo));
  const ss=filtra(sol.data??[]);const sla=agora?slaSolicitacoes(ss,agora):null;
  const solicitacoes=ss.filter(s=>(status==='todos'||s.status===status)&&(f.indicador!=='sla'||sla?.antigas.some(a=>a.id===s.id)));
  const base=filtra(marc.data??[]).filter(m=>(geoFiltro==='todos'||m.geo_status===geoFiltro)&&(f.local==='todos'||m.local_id===f.local));
  const dias=[...agruparPorDia(base).values()];const diasIndicador=new Set(dias.filter(d=>f.indicador==='completas'?jornadaCompleta(d):f.indicador==='incompletas'?!jornadaCompleta(d):f.indicador==='limite'?minutosTrabalhados(d)>(regras.data?.limite_diario_min??600):f.indicador==='extras'?!!regras.data&&saldoDia(d,regras.data)>0:true).map(d=>`${d[0]?.user_id}|${d[0]?.data_local}`));
  const marcacoes=base.filter(m=>diasIndicador.has(`${m.user_id}|${m.data_local}`));
  const elegiveis=solicitacoes.filter(s=>s.status==='pendente'&&s.user_id!==me.data?.user.id);const lote=elegiveis.filter(s=>selecionadas.includes(s.id));
  const decidir = useMutation({
    mutationFn: async (d: NonNullable<Decisao>) => {
      const { error } = await supabase.rpc("decidir_solicitacoes_lote", { _ids: d.ids, _aprovar: d.aprovar, ...(just ? { _justificativa: just } : {}) });
      if (error) throw error;
    },
    onSuccess: (_, d) => {
      toast.success(d.aprovar ? "Solicitação aprovada e marcação registrada." : "Solicitação rejeitada.");
      setDec(null); setJust(""); setSelecionadas([]);
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      qc.invalidateQueries({ queryKey: ["marcacoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportar = async(formato:'csv'|'xlsx') => {
   setExportando(true);try{await exportarGestao(marcacoes.map(m=>({Colaborador:nome(m.user_id),Equipe:profiles.data?.find(p=>p.id===m.user_id)?.equipe_id??'',Data:m.data_local,Tipo:TIPO_LABEL[m.tipo],Hora:m.hora_local,Origem:m.origem,'Fuso (min)':m.tz_offset_min,'Registrado no servidor':m.created_at,Latitude:m.latitude,Longitude:m.longitude,'Precisão (m)':m.precisao_m,'Distância (m)':m.distancia_m,'Status geo':m.geo_status,Local:locais.data?.find(l=>l.id===m.local_id)?.nome??'', 'Divergência (s)':m.divergencia_relogio_s,'Justificativa geo':m.geo_justificativa})),formato,`marcacoes-${de}-${ate}`);}catch{toast.error('Não foi possível exportar.');}finally{setExportando(false);}
  };
  return (
    <>
      <PageHeading eyebrow="Execução" title="Operação" desc="Fila de ajustes, consulta de marcações e histórico." />
      <FiltrosGestao value={f} onChange={onChange}/>
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="grid gap-1"><Label htmlFor="f-colab">Colaborador</Label>
            <Select value={colab} onValueChange={colab=>onChange({colab})}><SelectTrigger id="f-colab" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{profiles.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1"><Label htmlFor="f-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}><SelectTrigger id="f-tipo" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem>{TIPOS.map((t) => <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid gap-1"><Label htmlFor="f-status">Status</Label>
            <Select value={status} onValueChange={status=>onChange({status})}><SelectTrigger id="f-status" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem></SelectContent></Select></div>
          <div className="grid gap-1"><Label htmlFor="f-de">De</Label><Input id="f-de" type="date" className="h-11" value={de} onChange={(e) => onChange({de:e.target.value})} /></div>
          <div className="grid gap-1"><Label htmlFor="f-ate">Até</Label><Input id="f-ate" type="date" className="h-11" value={ate} onChange={(e) => onChange({ate:e.target.value})} /></div>
        </div>
      </Panel>

      <div className="mt-4 grid gap-1"><Label htmlFor="f-geo">Status da localização</Label><Select value={geoFiltro} onValueChange={setGeoFiltro}><SelectTrigger id="f-geo" className="h-11"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{Object.entries(GEO_LABEL).map(([k,l])=><SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
      <div className="my-4 flex flex-wrap gap-4 text-sm"><p>Tempo mediano de decisão: <b>{sla?.mediana===null||!sla?'—':`${sla.mediana.toFixed(1)} h`}</b></p><p>Pendências acima de 48 h: <b>{sla?.antigas.length??0}</b></p></div>
      {f.indicador!=='todos'&&<p className="mb-4">Indicador: {({extras:'Horas extras',completas:'Jornadas completas',incompletas:'Dias incompletos',limite:'Acima do limite diário',sla:'Pendências acima de 48 h'} as Record<string,string>)[f.indicador]??f.indicador} <Button variant="ghost" className="min-h-11" onClick={()=>onChange({indicador:'todos'})}>Limpar</Button></p>}
      {(marc.isPending || sol.isPending) && <p role="status" className="mt-4">Carregando operação…</p>}
      {(marc.isError || sol.isError || profiles.isError || vinculos.isError) && <p role="alert" className="mt-4 text-destructive">Não foi possível carregar a operação. <Button className="min-h-11" variant="outline" onClick={() => { void marc.refetch(); void sol.refetch(); void profiles.refetch(); void vinculos.refetch(); }}>Tentar de novo</Button></p>}
      <div className="mt-6 grid gap-6">
        <Panel title={`Solicitações de ajuste (${solicitacoes.length})`}>
          <div className="mb-4 flex flex-wrap items-center gap-2"><Button variant="outline" className="min-h-11" disabled={!elegiveis.length} onClick={()=>setSelecionadas(elegiveis.slice(0,100).map(s=>s.id))}>Selecionar pendentes</Button><Button variant="ghost" className="min-h-11" onClick={()=>setSelecionadas([])}>Limpar seleção</Button><span>{lote.length} selecionadas</span><Button className="min-h-11" disabled={!lote.length} onClick={()=>setDec({ids:lote.map(s=>s.id),aprovar:true,resumo:`${lote.length} solicitações selecionadas`})}>Aprovar em lote</Button><Button variant="outline" className="min-h-11" disabled={!lote.length} onClick={()=>setDec({ids:lote.map(s=>s.id),aprovar:false,resumo:`${lote.length} solicitações selecionadas`})}>Rejeitar em lote</Button></div>
          {solicitacoes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2">Seleção</th><th>Colaborador</th><th>Tipo</th><th>Data</th><th>Horário</th><th>Motivo</th><th>Observação</th><th>Status / decisão</th><th className="text-right">Ações</th></tr></thead>
            <tbody className="divide-y">{solicitacoes.map((s) => {
              const propria = s.user_id === me.data?.user.id;
              const resumo = `${nome(s.user_id)} — ${TIPO_LABEL[s.tipo]} em ${formatarData(s.data_solicitada)} às ${s.hora_solicitada.slice(0, 5)}`;
              return (
                <tr key={s.id} className={`align-top ${sla?.antigas.some(a=>a.id===s.id)?'bg-warning text-warning-foreground':''}`}>
                  <td className="py-3"><div className="grid size-11 place-items-center"><Checkbox aria-label={`Selecionar ${resumo}`} disabled={s.status!=='pendente'||propria||(!selecionadas.includes(s.id)&&selecionadas.length>=100)} checked={selecionadas.includes(s.id)} onCheckedChange={v=>setSelecionadas(old=>v?[...old,s.id]:old.filter(id=>id!==s.id))}/></div></td>
                  <td className="py-3 font-medium">{nome(s.user_id)}{sla?.antigas.some(a=>a.id===s.id)&&<p className="text-xs font-bold">Pendente há mais de 48 h</p>}</td>
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
                        <Button size="sm" className="min-h-11" onClick={() => setDec({ ids: [s.id], aprovar: true, resumo })}><Check className="size-4" />Aprovar</Button>
                        <Button size="sm" variant="outline" className="min-h-11" onClick={() => setDec({ ids: [s.id], aprovar: false, resumo })}><X className="size-4" />Rejeitar</Button>
                      </div>)}</td>
                </tr>
              );
            })}</tbody></table></div> : <p className="text-sm text-muted-foreground">Nenhuma solicitação com esses filtros.</p>}
        </Panel>

        <Panel title={`Marcações e histórico (${marcacoes.length})`} action={<div className="flex flex-wrap gap-2">{(['csv','xlsx'] as const).map(formato=><Button key={formato} variant="outline" size="sm" className="min-h-11" onClick={()=>void exportar(formato)} disabled={!marcacoes.length||exportando}><Download className="size-4"/>Exportar {formato.toUpperCase()}</Button>)}</div>}>
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
            <AlertDialogTitle>{dec?.aprovar ? "Aprovar solicitações?" : "Rejeitar solicitações?"}</AlertDialogTitle>
            <AlertDialogDescription>{dec?.resumo}. {dec?.aprovar ? "A marcação será registrada com origem ajuste e o saldo será recalculado." : "O saldo não será alterado."}</AlertDialogDescription>
          </AlertDialogHeader>
          {dec && !dec.aprovar && <div className="grid gap-1.5"><Label htmlFor="just">Justificativa da rejeição</Label><Textarea id="just" value={just} onChange={(e) => setJust(e.target.value)} maxLength={500} /></div>}
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11" disabled={decidir.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" disabled={decidir.isPending} onClick={(e) => { e.preventDefault(); if (dec) decidir.mutate(dec); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
