import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeading, Panel } from "@/components/ponto/PageHeading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { diasAtras, useProfiles, useTodasMarcacoes } from "@/lib/gestor-queries";
import { useRegras } from "@/lib/queries";
import { TIPOS, TIPO_LABEL, agruparPorDia, formatarData, formatarHora, formatarMinutos, minutosTrabalhados, saldoBanco, saldoDia } from "@/lib/ponto";

export const Route = createFileRoute("/_authenticated/gestor/equipe")({
  head: () => ({ meta: [{ title: "Equipe — Ponto Inteligente" }, { name: "description", content: "Jornadas, faltas, atrasos e saldo por colaborador." }] }),
  component: Equipe,
});

function diasUteis(desde: string) {
  const out: string[] = [];
  const d = new Date(desde + "T12:00:00");
  const hoje = new Date();
  while (d < hoje) {
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function Equipe() {
  const profiles = useProfiles();
  const regras = useRegras();
  const desde = diasAtras(30);
  const marc = useTodasMarcacoes(desde);
  const [sel, setSel] = useState<string>("");
  const id = sel || profiles.data?.[0]?.id || "";
  const p = profiles.data?.find((x) => x.id === id);
  const ms = (marc.data ?? []).filter((m) => m.user_id === id);
  const dias = [...agruparPorDia(ms).values()].sort((a, b) => b[0]!.data_local.localeCompare(a[0]!.data_local));
  const r = regras.data;
  const comMarc = new Set(ms.map((m) => m.data_local));
  const faltas = diasUteis(desde).filter((d) => !comMarc.has(d)).length;
  const atrasos = dias.filter((d) => saldoDia(d, r ?? { jornada_diaria_min: 0, tolerancia_min: 0, limite_diario_min: 0, validade_banco_dias: 0 }) < 0).length;

  return (
    <>
      <PageHeading eyebrow="Pessoas" title="Equipe" desc="Consulta individual dos últimos 30 dias.">
        <div className="grid gap-1"><Label htmlFor="colab">Colaborador</Label>
          <Select value={id} onValueChange={setSel}><SelectTrigger id="colab" className="h-11 w-60 bg-card"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{profiles.data?.map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent></Select></div>
      </PageHeading>
      {p && r && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Dias trabalhados", dias.length],
              ["Faltas (dias úteis)", faltas],
              ["Dias abaixo da jornada", atrasos],
              ["Saldo", formatarMinutos(saldoBanco(ms, r))],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border bg-card p-5 shadow-card"><div className="text-xs font-semibold text-muted-foreground">{l}</div><div className="tabular mt-2 text-2xl font-extrabold">{v}</div></div>
            ))}
          </div>
          <div className="mt-6"><Panel title={`Jornadas — ${p.nome}`}>
            {dias.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-2">Data</th>{TIPOS.map((t) => <th key={t}>{TIPO_LABEL[t]}</th>)}<th>Trabalhado</th><th className="text-right">Saldo</th></tr></thead>
              <tbody className="divide-y">{dias.map((d) => (
                <tr key={d[0]!.data_local}><td className="py-2.5 font-medium">{formatarData(d[0]!.data_local)}</td>
                  {TIPOS.map((t) => { const m = d.find((x) => x.tipo === t); return <td key={t} className="tabular">{m ? formatarHora(m.momento_dispositivo) : "—"}</td>; })}
                  <td className="tabular">{formatarMinutos(minutosTrabalhados(d), false)}</td>
                  <td className="tabular text-right font-semibold">{formatarMinutos(saldoDia(d, r))}</td></tr>
              ))}</tbody></table></div> : <p className="text-sm text-muted-foreground">Sem marcações no período.</p>}
          </Panel></div>
        </>
      )}
    </>
  );
}
