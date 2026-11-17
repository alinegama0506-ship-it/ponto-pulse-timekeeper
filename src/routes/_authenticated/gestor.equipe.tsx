import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MODALIDADES } from "@/lib/geo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/queries";
import { PageHeading, Panel } from "@/components/ponto/PageHeading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useProfiles, useTodasMarcacoes, useEquipes, useVinculosGestao } from "@/lib/gestor-queries";
import { useRegras } from "@/lib/queries";
import { Input } from '@/components/ui/input';
import { ConvitesGestao } from '@/components/ponto/ConvitesGestao';
import { FiltrosGestao } from '@/components/ponto/FiltrosGestao';
import { validarFiltrosGestao, useFiltrosGestao } from '@/lib/gestao-filtros';
import { FolhaMensal } from '@/components/ponto/FolhaMensal';
import { TIPOS, TIPO_LABEL, agruparPorDia, formatarData, formatarMinutos, minutosTrabalhados, saldoBanco, saldoDia } from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/gestor/equipe")({
  validateSearch: validarFiltrosGestao,
  head: () => ({ meta: [{ title: "Equipe — Ponto Inteligente" }, { property: "og:title", content: "Equipe — Ponto Inteligente" }, { property: "og:description", content: "Jornadas, faltas, atrasos e saldo por colaborador." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "description", content: "Jornadas, faltas, atrasos e saldo por colaborador." }] }),
  component: Equipe,
});

function Equipe() {
  const profiles = useProfiles();
  const regras = useRegras();
  const {value:f,onChange}=useFiltrosGestao('/gestor/equipe');const vinculos=useVinculosGestao();
  const marc = useTodasMarcacoes(f.de,f.ate);
  const pessoas=(profiles.data??[]).filter(p=>(f.equipe==='todos'||(f.equipe==='sem'?!p.equipe_id:p.equipe_id===f.equipe))&&(f.local==='todos'||vinculos.data?.some(v=>v.user_id===p.id&&v.local_id===f.local)||marc.data?.some(m=>m.user_id===p.id&&m.local_id===f.local)));
  const [sel, setSel] = useState<string>("");
  const id = pessoas.some(p=>p.id===(sel||f.colab))?(sel||f.colab):pessoas[0]?.id??"";
  const p = profiles.data?.find((x) => x.id === id);
  const ms = (marc.data ?? []).filter((m) => m.user_id === id&&(f.local==='todos'||m.local_id===f.local));
  const dias = [...agruparPorDia(ms).values()].sort((a, b) => (b[0]?.data_local ?? "").localeCompare(a[0]?.data_local ?? ""));
  const r = regras.data;

  const atrasos = dias.filter((d) => saldoDia(d, r ?? { jornada_diaria_min: 0, tolerancia_min: 0, limite_diario_min: 0, validade_banco_dias: 0 }) < 0).length;

  return (
    <>
      <PageHeading eyebrow="Pessoas" title="Equipe" desc="Jornadas e acessos por colaborador.">
        <div className="grid gap-1"><Label htmlFor="colab">Colaborador</Label>
          <Select value={id} onValueChange={setSel}><SelectTrigger id="colab" className="h-11 w-full sm:w-60 bg-card"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{pessoas.map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent></Select></div>
      </PageHeading>
      <FiltrosGestao value={f} onChange={onChange}/>
      <div className="mb-6"><AcessosPanel pessoas={pessoas}/></div><ConvitesGestao/>
      {(profiles.isPending||marc.isPending||regras.isPending)&&<p role="status" className="my-4">Carregando equipe…</p>}
      {(profiles.isError||marc.isError||regras.isError||vinculos.isError)&&<p role="alert" className="my-4">Não foi possível carregar equipe. <Button variant="outline" className="min-h-11" onClick={()=>{void profiles.refetch();void marc.refetch();void regras.refetch();void vinculos.refetch();}}>Tentar de novo</Button></p>}
      {!profiles.isPending&&!pessoas.length&&<p className="my-4">Nenhum colaborador com esses filtros.</p>}
      {p && r && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Dias trabalhados", dias.length],
              ["Situação", p.ativo?"Ativo":"Inativo"],
              ["Dias abaixo da jornada", atrasos],
              ["Saldo", formatarMinutos(saldoBanco(ms, r))],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border bg-card p-4 shadow-card"><div className="text-xs font-semibold text-muted-foreground">{l}</div><div className="tabular mt-2 text-2xl font-extrabold">{v}</div></div>
            ))}
          </div>
          <div className="mt-6"><Panel title={`Jornadas — ${p.nome}`}>
            {dias.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Data</th>{TIPOS.map((t) => <th key={t}>{TIPO_LABEL[t]}</th>)}<th>Trabalhado</th><th className="text-right">Saldo</th></tr></thead>
              <tbody className="divide-y">{dias.map((d) => (
                <tr key={d[0]?.data_local ?? ""}><td className="py-2.5 font-medium">{formatarData(d[0]?.data_local ?? "")}</td>
                  {TIPOS.map((t) => { const m = d.find((x) => x.tipo === t); return <td key={t} className="tabular">{m ? m.hora_local.slice(0,5) : "—"}</td>; })}
                  <td className="tabular">{formatarMinutos(minutosTrabalhados(d), false)}</td>
                  <td className="tabular text-right font-semibold">{formatarMinutos(saldoDia(d, r))}</td></tr>
              ))}</tbody></table></div> : <p className="text-sm text-muted-foreground">Sem marcações no período.</p>}
          </Panel></div><p className="my-4 text-sm text-muted-foreground">Escalas, faltas, atrasos e horas a vencer aguardam o motor de jornada.</p><FolhaMensal userId={p.id} gestor/>

        </>
      )}
    </>
  );
}

function AcessosPanel({pessoas}:{pessoas:NonNullable<ReturnType<typeof useProfiles>["data"]>}) {
  const qc = useQueryClient();
  const me = useMe();
  const equipes=useEquipes();const [novaEquipe,setNovaEquipe]=useState('');
  const criarEquipe=useMutation({mutationFn:async()=>{const {error}=await supabase.from('equipes').insert({nome:novaEquipe.trim()});if(error)throw error;},onSuccess:()=>{setNovaEquipe('');void qc.invalidateQueries({queryKey:['equipes']});toast.success('Equipe criada.');},onError:(e:Error)=>toast.error(e.message)});
  const alterar=useMutation({mutationFn:async(v:{id:string;ativo?:boolean;equipe_id?:string|null})=>{const {id,...dados}=v;const {error}=await supabase.from('profiles').update(dados).eq('id',id);if(error)throw error;},onSuccess:()=>{void qc.invalidateQueries({queryKey:['profiles']});void qc.invalidateQueries({queryKey:['me']});toast.success('Colaborador atualizado.');},onError:(e:Error)=>toast.error(e.message)});
  const roles = useQuery({
    queryKey: ["roles", "todos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role").eq("role", "gestor");
      if (error) throw error;
      return new Set(data.map((x) => x.user_id));
    },
  });
  const modalidade = useMutation({ mutationFn: async (v: { id: string; modalidade: string }) => { const { error } = await supabase.from("profiles").update({ modalidade: v.modalidade }).eq("id", v.id); if (error) throw error; }, onSuccess: () => { toast.success("Modalidade atualizada."); qc.invalidateQueries({ queryKey: ["profiles"] }); qc.invalidateQueries({ queryKey: ["me"] }); }, onError: (e: Error) => toast.error(e.message) });
  const mut = useMutation({
    mutationFn: async (v: { id: string; gestor: boolean }) => {
      const { error } = await supabase.rpc("definir_gestor", { _user_id: v.id, _gestor: v.gestor });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Acesso atualizado."); qc.invalidateQueries({ queryKey: ["roles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Panel title="Acessos">
      <p className="mb-3 text-sm text-muted-foreground">Colaboradores veem apenas o próprio ponto. Gestor/RH vê a equipe toda, aprova ajustes e altera regras.</p>
      <form className="mb-4 flex flex-wrap items-end gap-2" onSubmit={e=>{e.preventDefault();criarEquipe.mutate();}}><div className="grid gap-1"><Label htmlFor="nova-equipe">Nova equipe</Label><Input id="nova-equipe" className="h-11" required maxLength={100} value={novaEquipe} onChange={e=>setNovaEquipe(e.target.value)}/></div><Button className="min-h-11" type="submit" disabled={criarEquipe.isPending}>Criar equipe</Button></form>
      {roles.isError&&<p role="alert">Não foi possível carregar acessos.</p>}
      <ul className="divide-y">
        {pessoas.map((p) => {
          const g = roles.data?.has(p.id) ?? false;
          const eu = p.id === me.data?.user.id;
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div className="min-w-0 break-words"><span className="font-medium">{p.nome}</span> <span className="text-muted-foreground">{p.email}</span></div>
              <div className="grid gap-1"><Label htmlFor={`modalidade-${p.id}`}>Modalidade</Label><Select value={p.modalidade} onValueChange={v => modalidade.mutate({ id: p.id, modalidade: v })} disabled={modalidade.isPending}><SelectTrigger id={`modalidade-${p.id}`} className="h-11 w-36"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(MODALIDADES).map(([k,l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-1"><Label htmlFor={`equipe-${p.id}`}>Equipe</Label><Select value={p.equipe_id??'sem'} onValueChange={v=>alterar.mutate({id:p.id,equipe_id:v==='sem'?null:v})} disabled={alterar.isPending}><SelectTrigger id={`equipe-${p.id}`} className="h-11 w-40"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="sem">Sem equipe</SelectItem>{equipes.data?.map(e=><SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex flex-wrap items-center gap-2"><Badge variant={p.ativo?'success':'secondary'}>{p.ativo?'Ativo':'Inativo'}</Badge>{!eu&&<Button variant="outline" className="min-h-11" disabled={alterar.isPending} onClick={()=>{if(window.confirm(`${p.ativo?'Desativar':'Ativar'} ${p.nome}?`))alterar.mutate({id:p.id,ativo:!p.ativo});}}>{p.ativo?'Desativar':'Ativar'}</Button>}
                <Badge variant={g ? "success" : "secondary"}>{g ? "Gestor/RH" : "Colaborador"}</Badge>
                {!eu && <Button size="sm" variant="outline" className="min-h-11" disabled={mut.isPending || !roles.data}
                  onClick={() => mut.mutate({ id: p.id, gestor: !g })}>{g ? "Tornar colaborador" : "Tornar Gestor/RH"}</Button>}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
