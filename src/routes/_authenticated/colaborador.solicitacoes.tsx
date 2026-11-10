import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolicitacaoForm } from "@/components/ponto/SolicitacaoForm";
import { useMinhasSolicitacoes } from "@/lib/colaborador-queries";
import { statusVariant } from "@/lib/gestor-queries";
import { MOTIVO_LABEL, STATUS_LABEL, TIPO_LABEL } from "@/lib/ponto";
import { useT } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/colaborador/solicitacoes")({ head: () => pageHead("Solicitações", "Solicite ajustes e acompanhe as decisões."), component: Solicitacoes });
function Solicitacoes(){const {t,data}=useT();const sol=useMinhasSolicitacoes();return <div className="mx-auto grid max-w-3xl gap-5"><h1 className="text-2xl font-bold">{t('Solicitações')}</h1><section className="rounded-2xl border bg-card p-5 shadow-card"><h2 className="font-bold">{t('Solicitar ajuste de ponto')}</h2><p className="mb-4 text-sm text-muted-foreground">{t('Para marcações esquecidas ou com horário incorreto.')}</p><SolicitacaoForm/></section><section className="rounded-2xl border bg-card p-5 shadow-card"><h2 className="mb-3 font-bold">{t('Minhas solicitações')}</h2>{sol.isPending?<p role="status">{t('Carregando…')}</p>:sol.isError?<div role="alert">{t('Não foi possível carregar os dados.')} <Button variant="outline" className="min-h-11" onClick={()=>void sol.refetch()}>{t('Tentar de novo')}</Button></div>:sol.data?.length?<ul className="divide-y">{sol.data.map(s=><li key={s.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><div><div className="font-semibold">{t(TIPO_LABEL[s.tipo])} · {data(s.data_solicitada)} · {s.hora_solicitada.slice(0,5)}</div><div className="text-muted-foreground">{t(MOTIVO_LABEL[s.motivo])}{s.observacao?` — ${s.observacao}`:''}</div>{s.justificativa_rejeicao&&<div className="text-xs text-destructive">{t('Justificativa')}: {s.justificativa_rejeicao}</div>}</div><Badge variant={statusVariant[s.status]}>{t(STATUS_LABEL[s.status])}</Badge></li>)}</ul>:<p>{t('Nenhuma solicitação ainda.')}</p>}</section></div>;}
