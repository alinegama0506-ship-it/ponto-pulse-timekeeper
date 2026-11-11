import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fingerprint, MapPin, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GEO_LABEL, obterPosicao, podeConfirmarGeo, type GeoResultado } from "@/lib/geo";
import { capturarMomentoLocal, TIPO_LABEL, type TipoMarcacao } from "@/lib/ponto";
import { useMe, useRegras } from "@/lib/queries";

import { useT } from "@/lib/i18n";

type Posicao = { latitude?: number; longitude?: number; precisao_m?: number; falha: "sem_permissao" | "indisponivel" };
export function GeoRegistro({ tipo, disabled }: { tipo: TipoMarcacao | null; disabled: boolean }) {
  const { t } = useT();
  const qc = useQueryClient(); const me = useMe(); const regras = useRegras();
  const [open, setOpen] = useState(false); const [aviso, setAviso] = useState(false); const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState<GeoResultado | null>(null); const [pos, setPos] = useState<Posicao>({ falha: "indisponivel" });
  const [just, setJust] = useState(""); const [error, setError] = useState(""); const tentativa = useRef(0);
  const capturar = async () => {
    const atual = ++tentativa.current; setLoading(true); setGeo(null); setError("");
    let p: Posicao;
    try { p = await obterPosicao(); } catch (e) { p = { falha: (e as { code?: number }).code === 1 ? "sem_permissao" : "indisponivel" }; }
    if (atual !== tentativa.current) return;
    setPos(p);
    const { data, error: err } = await supabase.rpc("avaliar_localizacao", { ...(p.latitude !== undefined && p.longitude !== undefined && p.precisao_m !== undefined ? { _latitude: p.latitude, _longitude: p.longitude, _precisao_m: p.precisao_m } : {}), _falha: p.falha });
    if (atual !== tentativa.current) return;
    if (err) setError(err.message); else setGeo(data as unknown as GeoResultado);
    setLoading(false);
  };
  const ciencia = useMutation({ mutationFn: async () => { const { error } = await supabase.rpc("registrar_ciencia_geo"); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["me"] }); setAviso(false); void capturar(); }, onError: (e: Error) => setError(e.message) });
  const registrar = useMutation({ mutationFn: async () => {
    if (!tipo || !geo || !podeConfirmarGeo(geo.geo_status, geo.geo_modo, just)) throw new Error("Confira a localização e a justificativa.");
    const c = capturarMomentoLocal();
    const { error } = await supabase.rpc("registrar_marcacao", { _tipo: tipo, _momento_dispositivo: c.momento_dispositivo, _data_local: c.data_local, _hora_local: c.hora_local, _tz_offset_min: c.tz_offset_min, ...(c.timezone ? { _timezone: c.timezone } : {}), ...(pos.latitude !== undefined && pos.longitude !== undefined && pos.precisao_m !== undefined ? { _latitude: pos.latitude, _longitude: pos.longitude, _precisao_m: pos.precisao_m } : {}), _falha: pos.falha, ...(just.trim() ? { _justificativa: just.trim() } : {}) });
    if (error) throw new Error(error.code === "23505" ? "Esta marcação já foi registrada hoje." : error.message);
    return `${TIPO_LABEL[tipo]} registrada às ${c.hora_local}`;
  }, onSuccess: message => { toast.success(message); setOpen(false); qc.invalidateQueries({ queryKey: ["marcacoes"] }); }, onError: (e: Error) => setError(e.message) });
  const iniciar = () => { setOpen(true); setJust(""); setError(""); setGeo(null); const primeiro = !me.data?.profile?.geo_aviso_visto_em; setAviso(primeiro); if (!primeiro) void capturar(); };
  const requerJust = geo && !["dentro","dispensado"].includes(geo.geo_status) && geo.geo_modo === "justificar";
  return <>
    <Button size="lg" className="mt-5 h-14 w-full text-base" disabled={disabled || !tipo || !me.data || !regras.data} onClick={iniciar}><Fingerprint className="size-5" />{tipo ? `${t("Registrar")} ${t(TIPO_LABEL[tipo])}` : t("Jornada do dia concluída")}</Button>
    <Dialog open={open} onOpenChange={v => { if (!registrar.isPending && !ciencia.isPending) { setOpen(v); if (!v) tentativa.current++; } }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto max-sm:w-[calc(100%-24px)] rounded-lg">
        <DialogHeader><DialogTitle>{t(aviso ? "Sua localização no ponto" : "Confirmar marcação")}</DialogTitle><DialogDescription>{t(aviso ? "Aviso de transparência" : tipo ? TIPO_LABEL[tipo] : "Registro de ponto")}</DialogDescription></DialogHeader>
        {aviso ? <><p className="whitespace-pre-wrap text-sm">{regras.data?.geo_aviso}</p><Button className="min-h-11" disabled={ciencia.isPending} onClick={() => ciencia.mutate()}>{t(ciencia.isPending ? "Salvando…" : "Li o aviso e continuar")}</Button></> : <>
          <div aria-live="polite" role="status" className="flex gap-3 rounded-lg border bg-muted p-4"><MapPin className="size-5 shrink-0" /><div className="text-sm">
            {loading ? t("Obtendo localização…") : geo ? <><b>{t(GEO_LABEL[geo.geo_status])}</b>{geo.local_nome && <p>{geo.local_nome}{geo.distancia_m !== null ? ` (a ~${Math.round(geo.distancia_m)} m)` : ""}</p>}{geo.geo_status === "precisao_baixa" && <p>±{Math.round(pos.precisao_m ?? 0)} m: tente perto de uma janela ou ao ar livre.</p>}{geo.geo_status === "dispensado" && <p>{pos.latitude === undefined ? "Sem localização. Modalidade dispensada de bloqueio." : "Localização obtida. Modalidade dispensada de bloqueio."}</p>}</> : t("Não foi possível conferir a localização.")}
          </div></div>
          {geo?.geo_status === "sem_permissao" && <div className="text-sm"><p className="font-semibold">{t("Liberar localização")}</p><ul className="mt-2 list-disc space-y-2 pl-5"><li>iPhone: Ajustes → Privacidade e Segurança → Serviços de Localização → Safari (ou seu navegador) → Durante o uso. No site, toque em aA → Ajustes do Site → Localização → Permitir.</li><li>Android: Configurações → Apps → seu navegador → Permissões → Localização → Permitir durante o uso. No navegador, abra as permissões deste site e permita Localização.</li><li>Computador: clique no ícone de permissões ao lado do endereço → Localização → Permitir. Confira também a permissão do navegador nas configurações do sistema.</li></ul></div>}
          <Button variant="outline" className="min-h-11" disabled={loading || registrar.isPending} onClick={() => void capturar()}><RotateCw className="size-4" />{t("Tentar de novo")}</Button>
          {requerJust && <div className="grid gap-2"><Label htmlFor="geo-just">{t("Justificativa obrigatória (mínimo 10 caracteres)")}</Label><Textarea id="geo-just" value={just} maxLength={1000} onChange={e => setJust(e.target.value)} /></div>}
          {geo?.geo_modo === "bloquear" && !["dentro","dispensado"].includes(geo.geo_status) && <p className="text-sm text-destructive">{t("Registro bloqueado pelas regras de localização.")}</p>}
          <Button className="min-h-11" disabled={loading || registrar.isPending || !geo || !podeConfirmarGeo(geo.geo_status,geo.geo_modo,just)} onClick={() => registrar.mutate()}>{t(registrar.isPending ? "Registrando…" : "Confirmar registro")}</Button>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  </>;
}