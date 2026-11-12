import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOTIVO_LABEL, TIPOS, TIPO_LABEL, dataLocalHoje, validarSolicitacao, type ErrosSolicitacao, type Motivo, type TipoMarcacao } from "@/lib/ponto";

import { useT } from "@/lib/i18n";

const vazio = { data_solicitada: "", hora_solicitada: "", tipo: "", motivo: "", observacao: "" };

export function SolicitacaoForm({ onDone }: { onDone?: () => void }) {
  const { t } = useT();
  const qc = useQueryClient();
  const [v, setV] = useState(vazio);
  const [erros, setErros] = useState<ErrosSolicitacao>({});
  const set = (k: keyof typeof vazio, val: string) => setV((s) => ({ ...s, [k]: val }));

  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("solicitacoes").insert({
        data_solicitada: v.data_solicitada,
        hora_solicitada: v.hora_solicitada,
        tipo: v.tipo as TipoMarcacao,
        motivo: v.motivo as Motivo,
        observacao: v.observacao.trim() || null,
        tz_offset_min: -new Date(`${v.data_solicitada}T${v.hora_solicitada}`).getTimezoneOffset(),
      });
      if (error) {
        if (error.code === "23505") throw new Error("Já existe uma solicitação pendente para esta data e tipo.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("Solicitação enviada. O saldo só muda após aprovação."));
      setV(vazio);
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er = validarSolicitacao(v, dataLocalHoje());
    setErros(er);
    if (Object.keys(er).length === 0) m.mutate();
  };

  const err = (k: keyof ErrosSolicitacao) =>
    erros[k] ? (
      <p id={`${k}-erro`} role="alert" className="text-xs font-medium text-destructive">
        {t(erros[k] ?? "")}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="data_solicitada">{t("Data da marcação *")}</Label>
        <Input id="data_solicitada" type="date" max={dataLocalHoje()} className="h-11" value={v.data_solicitada}
          aria-invalid={!!erros.data_solicitada} aria-describedby="data_solicitada-erro"
          onChange={(e) => set("data_solicitada", e.target.value)} />
        {err("data_solicitada")}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="hora_solicitada">{t("Horário correto *")}</Label>
        <Input id="hora_solicitada" type="time" className="h-11" value={v.hora_solicitada}
          aria-invalid={!!erros.hora_solicitada} aria-describedby="hora_solicitada-erro"
          onChange={(e) => set("hora_solicitada", e.target.value)} />
        {err("hora_solicitada")}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tipo">{t("Tipo de marcação *")}</Label>
        <Select value={v.tipo} onValueChange={(x) => set("tipo", x)}>
          <SelectTrigger id="tipo" className="h-11" aria-invalid={!!erros.tipo}><SelectValue placeholder={t("Selecione")} /></SelectTrigger>
          <SelectContent>{TIPOS.map((tipo) => <SelectItem key={tipo} value={tipo}>{t(TIPO_LABEL[tipo])}</SelectItem>)}</SelectContent>
        </Select>
        {err("tipo")}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="motivo">{t("Motivo de não bater o ponto *")}</Label>
        <Select value={v.motivo} onValueChange={(x) => set("motivo", x)}>
          <SelectTrigger id="motivo" className="h-11" aria-invalid={!!erros.motivo}><SelectValue placeholder={t("Selecione")} /></SelectTrigger>
          <SelectContent>{(Object.keys(MOTIVO_LABEL) as Motivo[]).map((k) => <SelectItem key={k} value={k}>{t(MOTIVO_LABEL[k])}</SelectItem>)}</SelectContent>
        </Select>
        {err("motivo")}
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="observacao">{t("Observações")}</Label>
        <Textarea id="observacao" rows={3} maxLength={1000} placeholder={t("Explique o ocorrido (opcional)")}
          value={v.observacao} onChange={(e) => set("observacao", e.target.value)} />
        {err("observacao")}
      </div>
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p className="text-xs text-muted-foreground">{t("A solicitação nasce pendente e não altera o saldo até a aprovação.")}</p>
        <Button type="submit" className="h-11" disabled={m.isPending}>{t(m.isPending ? "Enviando…" : "Enviar solicitação")}</Button>
      </div>
    </form>
  );
}
