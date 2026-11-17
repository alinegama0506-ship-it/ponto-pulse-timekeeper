import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { PageHeading, Panel } from "@/components/ponto/PageHeading";
import { useLocais } from "@/lib/geo-queries";
import { localizarEndereco } from "@/lib/endereco.functions";
import type { EnderecoLocalizado } from "@/lib/endereco";
import type { Database } from "@/integrations/supabase/types";
export const Route = createFileRoute("/_authenticated/gestor/locais")({ head: () => ({ meta: [{ title: "Locais de trabalho — Ponto Inteligente" }, { name: "description", content: "Áreas autorizadas e vínculos dos colaboradores." }, { property: "og:title", content: "Locais de trabalho — Ponto Inteligente" }, { property: "og:description", content: "Áreas autorizadas e vínculos dos colaboradores." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Locais });
type Local = Database["public"]["Tables"]["locais_trabalho"]["Row"];
const vazio = { id: "", nome: "", endereco: "", latitude: "", longitude: "", raio_m: 150, ativo: true };
function Locais() {
  const locais = useLocais(); const qc = useQueryClient(); const buscarEndereco = useServerFn(localizarEndereco);
  const [v,setV] = useState(vazio); const [err,setErr] = useState("");
  const [candidatos, setCandidatos] = useState<EnderecoLocalizado[]>([]);
  const busca = useMutation({ mutationFn: () => buscarEndereco({ data: { endereco: v.endereco } }), onSuccess: data => { setCandidatos(data); setErr(data.length ? "" : "Endereço não encontrado. Informe rua, número, cidade e estado."); }, onError: (e: Error) => setErr(e.message) });
  const salvar = useMutation({ mutationFn: async () => {
    if (!v.nome.trim() || !v.endereco.trim()) throw new Error("Preencha o nome e o endereço.");
    if (!v.latitude.trim() || !v.longitude.trim() || !Number.isFinite(Number(v.latitude)) || !Number.isFinite(Number(v.longitude))) throw new Error("Busque o endereço e confirme o local encontrado.");
    const row = { nome: v.nome.trim(), endereco: v.endereco.trim(), latitude: Number(v.latitude), longitude: Number(v.longitude), raio_m: v.raio_m, ativo: v.ativo };
    const { error } = v.id ? await supabase.from("locais_trabalho").update(row).eq("id",v.id) : await supabase.from("locais_trabalho").insert(row);
    if (error) throw error;
  }, onSuccess: () => { setV(vazio); setCandidatos([]); setErr(""); qc.invalidateQueries({ queryKey: ["locais"] }); toast.success("Local salvo."); }, onError: (e: Error) => setErr(e.message) });
  const remover = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("locais_trabalho").delete().eq("id",id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["locais"] }); qc.invalidateQueries({ queryKey: ["vinculos"] }); toast.success("Local excluído."); }, onError: (e: Error) => setErr(e.message) });
  const editar = (l: Local) => { setCandidatos([]); setErr(""); setV({ ...l, latitude: String(l.latitude), longitude: String(l.longitude) }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <><PageHeading eyebrow="Geolocalização" title="Locais de trabalho" />
    <Panel title={v.id ? "Editar local" : "Novo local"}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); salvar.mutate(); }}>
        <div className="grid gap-2"><Label htmlFor="local-nome">Nome</Label><Input id="local-nome" className="h-11" maxLength={150} required value={v.nome} onChange={e => setV({ ...v,nome:e.target.value })} /></div>
        <div className="grid gap-2"><Label htmlFor="local-endereco">Endereço completo</Label><Input id="local-endereco" className="h-11" required maxLength={500} disabled={busca.isPending} value={v.endereco} onChange={e => { setV({ ...v,endereco:e.target.value,latitude:"",longitude:"" }); setCandidatos([]); }} /></div>
        <Button type="button" variant="outline" className="min-h-11 sm:col-span-2" disabled={busca.isPending || salvar.isPending || v.endereco.trim().length < 5} onClick={() => { setErr(""); setCandidatos([]); busca.mutate(); }}><Search className="size-4" />{busca.isPending ? "Buscando endereço…" : "Buscar endereço"}</Button>
        {busca.isPending && <p role="status" className="text-sm sm:col-span-2">Localizando endereço…</p>}
        {candidatos.length > 0 && <fieldset className="grid min-w-0 gap-2 sm:col-span-2"><legend className="mb-2 text-sm font-semibold">Confirme o endereço encontrado</legend>{candidatos.map((c, i) => <Button key={i} type="button" variant="outline" className="h-auto min-h-11 whitespace-normal break-words text-left" onClick={() => { setV({ ...v, latitude:String(c.latitude), longitude:String(c.longitude), endereco:c.endereco.slice(0,500) }); setCandidatos([]); }}>{c.endereco}</Button>)}<p className="text-xs text-muted-foreground">© OpenStreetMap contributors</p></fieldset>}
        {v.latitude && v.longitude && <p role="status" className="text-sm text-success-foreground sm:col-span-2">Endereço localizado: {v.endereco || v.nome}</p>}
        <div className="flex min-h-11 items-center gap-3"><Switch id="local-ativo" className="min-h-11 min-w-11" checked={v.ativo} onCheckedChange={ativo => setV({ ...v,ativo })} /><Label htmlFor="local-ativo">Local ativo</Label></div>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><Button className="min-h-11" disabled={salvar.isPending || busca.isPending || !v.latitude || !v.longitude}>{salvar.isPending ? "Salvando…" : "Salvar local"}</Button>{v.id && <Button type="button" variant="outline" className="min-h-11" onClick={() => { setV(vazio); setCandidatos([]); }}>Cancelar edição</Button>}</div>
      </form>
    </Panel>
    {err && <p role="alert" className="my-4 text-sm text-destructive">{err}</p>}
    <section className="mt-6 grid gap-4"><h2 className="font-bold">Locais cadastrados</h2>{locais.isPending ? <p role="status">Carregando…</p> : locais.isError ? <p role="alert">Não foi possível carregar os locais. <Button variant="outline" className="min-h-11" onClick={() => void locais.refetch()}>Tentar de novo</Button></p> : !locais.data?.length ? <p className="text-sm text-muted-foreground">Nenhum local cadastrado.</p> : locais.data.map(l => <article key={l.id} className="rounded-lg border bg-card p-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold">{l.nome}</h3><p className="text-sm text-muted-foreground">{l.endereco || "Sem endereço"}</p><p className="mt-1 text-xs">{l.latitude}, {l.longitude} · {l.raio_m} m</p><Badge className="mt-2" variant={l.ativo ? "success" : "secondary"}>{l.ativo ? "Ativo" : "Inativo"}</Badge></div><div className="flex gap-2"><Button variant="outline" size="icon" className="size-11" aria-label={`Editar ${l.nome}`} onClick={() => editar(l)}><Pencil /></Button><Button variant="outline" size="icon" className="size-11" aria-label={`Excluir ${l.nome}`} disabled={remover.isPending} onClick={() => { if (window.confirm(`Excluir ${l.nome}? Os vínculos serão removidos; as marcações permanecem.`)) remover.mutate(l.id); }}><Trash2 /></Button></div></div></article>)}</section>
  </>;
}