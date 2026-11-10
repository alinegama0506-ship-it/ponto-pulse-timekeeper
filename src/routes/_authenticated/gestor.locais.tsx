import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PageHeading, Panel } from "@/components/ponto/PageHeading";
import { useLocais, useVinculos } from "@/lib/geo-queries";
import { useProfiles } from "@/lib/gestor-queries";
import { obterPosicao } from "@/lib/geo";
import type { Database } from "@/integrations/supabase/types";
export const Route = createFileRoute("/_authenticated/gestor/locais")({ head: () => ({ meta: [{ title: "Locais de trabalho — Ponto Inteligente" }, { name: "description", content: "Áreas autorizadas e vínculos dos colaboradores." }, { property: "og:title", content: "Locais de trabalho — Ponto Inteligente" }, { property: "og:description", content: "Áreas autorizadas e vínculos dos colaboradores." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Locais });
type Local = Database["public"]["Tables"]["locais_trabalho"]["Row"];
const vazio = { id: "", nome: "", endereco: "", latitude: "", longitude: "", raio_m: 150, ativo: true };
function Locais() {
  const locais = useLocais(); const vinculos = useVinculos(); const profiles = useProfiles(); const qc = useQueryClient();
  const [v,setV] = useState(vazio); const [gps,setGps] = useState(false); const [err,setErr] = useState("");
  const salvar = useMutation({ mutationFn: async () => {
    if (!v.nome.trim() || !v.latitude.trim() || !v.longitude.trim() || !Number.isFinite(Number(v.latitude)) || !Number.isFinite(Number(v.longitude))) throw new Error("Preencha nome e coordenadas válidas.");
    const row = { nome: v.nome.trim(), endereco: v.endereco.trim(), latitude: Number(v.latitude), longitude: Number(v.longitude), raio_m: v.raio_m, ativo: v.ativo };
    const { error } = v.id ? await supabase.from("locais_trabalho").update(row).eq("id",v.id) : await supabase.from("locais_trabalho").insert(row);
    if (error) throw error;
  }, onSuccess: () => { setV(vazio); setErr(""); qc.invalidateQueries({ queryKey: ["locais"] }); toast.success("Local salvo."); }, onError: (e: Error) => setErr(e.message) });
  const remover = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("locais_trabalho").delete().eq("id",id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["locais"] }); qc.invalidateQueries({ queryKey: ["vinculos"] }); toast.success("Local excluído."); }, onError: (e: Error) => setErr(e.message) });
  const vincular = useMutation({ mutationFn: async (x: { user_id: string; local_id: string; adicionar: boolean }) => { const { error } = x.adicionar ? await supabase.from("colaborador_locais").insert({ user_id: x.user_id, local_id: x.local_id }) : await supabase.from("colaborador_locais").delete().eq("user_id",x.user_id).eq("local_id",x.local_id); if (error) throw error; }, onSuccess: () => qc.invalidateQueries({ queryKey: ["vinculos"] }), onError: (e: Error) => setErr(e.message) });
  const editar = (l: Local) => { setV({ ...l, latitude: String(l.latitude), longitude: String(l.longitude) }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <><PageHeading eyebrow="Geolocalização" title="Locais de trabalho" />
    <Panel title={v.id ? "Editar local" : "Novo local"}>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); salvar.mutate(); }}>
        <div className="grid gap-2"><Label htmlFor="local-nome">Nome</Label><Input id="local-nome" className="h-11" maxLength={150} required value={v.nome} onChange={e => setV({ ...v,nome:e.target.value })} /></div>
        <div className="grid gap-2"><Label htmlFor="local-endereco">Endereço</Label><Input id="local-endereco" className="h-11" maxLength={500} value={v.endereco} onChange={e => setV({ ...v,endereco:e.target.value })} /></div>
        <div className="grid gap-2"><Label htmlFor="local-lat">Latitude</Label><Input id="local-lat" type="number" step="any" min={-90} max={90} required className="h-11" value={v.latitude} onChange={e => setV({ ...v,latitude:e.target.value })} /></div>
        <div className="grid gap-2"><Label htmlFor="local-lng">Longitude</Label><Input id="local-lng" type="number" step="any" min={-180} max={180} required className="h-11" value={v.longitude} onChange={e => setV({ ...v,longitude:e.target.value })} /></div>
        <Button type="button" variant="outline" className="min-h-11 sm:col-span-2" disabled={gps} onClick={async () => { setGps(true); setErr(""); try { const p = await obterPosicao(); setV(s => ({ ...s,latitude:String(p.latitude),longitude:String(p.longitude) })); } catch { setErr("Localização indisponível. Permita o acesso ou informe as coordenadas."); } finally { setGps(false); } }}><MapPin className="size-4" />{gps ? "Obtendo localização…" : "Usar minha localização atual"}</Button>
        <div className="grid gap-2"><Label htmlFor="local-raio">Raio: {v.raio_m} m</Label><Slider id="local-raio" aria-label="Raio em metros" className="min-h-11" min={50} max={500} step={10} value={[v.raio_m]} onValueChange={a => setV({ ...v,raio_m:a[0] ?? 150 })} /></div>
        <div className="flex min-h-11 items-center gap-3"><Switch id="local-ativo" className="min-h-11 min-w-11" checked={v.ativo} onCheckedChange={ativo => setV({ ...v,ativo })} /><Label htmlFor="local-ativo">Local ativo</Label></div>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><Button className="min-h-11" disabled={salvar.isPending}>{salvar.isPending ? "Salvando…" : "Salvar local"}</Button>{v.id && <Button type="button" variant="outline" className="min-h-11" onClick={() => setV(vazio)}>Cancelar edição</Button>}</div>
      </form>
    </Panel>
    {err && <p role="alert" className="my-4 text-sm text-destructive">{err}</p>}
    <section className="mt-6 grid gap-4"><h2 className="font-bold">Locais cadastrados</h2>{locais.isPending ? <p role="status">Carregando…</p> : locais.isError ? <p role="alert">Não foi possível carregar os locais. <Button variant="outline" className="min-h-11" onClick={() => void locais.refetch()}>Tentar de novo</Button></p> : !locais.data?.length ? <p className="text-sm text-muted-foreground">Nenhum local cadastrado.</p> : locais.data.map(l => <article key={l.id} className="rounded-lg border bg-card p-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold">{l.nome}</h3><p className="text-sm text-muted-foreground">{l.endereco || "Sem endereço"}</p><p className="mt-1 text-xs">{l.latitude}, {l.longitude} · {l.raio_m} m</p><Badge className="mt-2" variant={l.ativo ? "success" : "secondary"}>{l.ativo ? "Ativo" : "Inativo"}</Badge></div><div className="flex gap-2"><Button variant="outline" size="icon" className="size-11" aria-label={`Editar ${l.nome}`} onClick={() => editar(l)}><Pencil /></Button><Button variant="outline" size="icon" className="size-11" aria-label={`Excluir ${l.nome}`} disabled={remover.isPending} onClick={() => { if (window.confirm(`Excluir ${l.nome}? Os vínculos serão removidos; as marcações permanecem.`)) remover.mutate(l.id); }}><Trash2 /></Button></div></div></article>)}</section>
    <div className="mt-6"><Panel title="Vínculos com colaboradores"><p className="mb-4 text-sm text-muted-foreground">Sem vínculo, qualquer local ativo é permitido. Com vínculos, somente os locais selecionados são permitidos.</p>{profiles.isPending || vinculos.isPending ? <p role="status">Carregando vínculos…</p> : profiles.isError || vinculos.isError ? <p role="alert">Não foi possível carregar os vínculos.</p> : profiles.data?.map(p => <div key={p.id} className="border-t py-3"><h3 className="font-semibold">{p.nome}</h3><div className="mt-2 flex flex-wrap gap-3">{locais.data?.map(l => <div key={l.id} className="flex min-h-11 items-center gap-2"><Checkbox id={`v-${p.id}-${l.id}`} className="size-11" disabled={vincular.isPending} checked={vinculos.data?.some(x => x.user_id===p.id && x.local_id===l.id)} onCheckedChange={c => vincular.mutate({ user_id:p.id,local_id:l.id,adicionar:c===true })} /><Label htmlFor={`v-${p.id}-${l.id}`}>{l.nome}{!l.ativo ? " (inativo)" : ""}</Label></div>)}</div></div>)}</Panel></div>
  </>;
}