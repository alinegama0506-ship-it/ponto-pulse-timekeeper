import { createFileRoute } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/_authenticated/colaborador/semana")({ head: () => pageHead("Minha semana", "Resumo semanal do ponto."), component: Semana });
function Semana(){const {t}=useT();return <div className="mx-auto max-w-3xl"><h1 className="text-2xl font-bold">{t('Minha semana')}</h1><p className="mt-4 rounded-xl border bg-card p-5">{t('A visão semanal será disponibilizada na Fase 3.')}</p></div>;}
