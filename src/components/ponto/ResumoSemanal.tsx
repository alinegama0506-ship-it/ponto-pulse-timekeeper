import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRegras } from '@/lib/queries';
import { usePeriodoSemana } from '@/lib/colaborador-queries';
import { dataLocalHoje, inicioSemana,deslocarData,resumoSemana,formatarMinutos } from '@/lib/ponto';
import { useT } from '@/lib/i18n';
export function ResumoSemanal(){const {t}=useT();const hoje=dataLocalHoje();const inicio=inicioSemana(hoje);const periodo=usePeriodoSemana(deslocarData(inicio,-7),deslocarData(inicio,6));const regras=useRegras();const s=periodo.data&&regras.data?resumoSemana(inicio,periodo.data.marcacoes,periodo.data.solicitacoes,regras.data,hoje):null;
return <section className="border-t pt-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{t('Minha semana')}</h2><Button asChild variant="ghost" className="min-h-11"><Link to="/colaborador/semana">{t('Ver semana')}<ArrowRight className="size-4"/></Link></Button></div>{periodo.isError?<p role="alert">{t('Não foi possível carregar os dados.')}</p>:s?<div className="flex flex-wrap gap-x-10 gap-y-3"><div><p className="text-xs text-muted-foreground">{t('Horas na semana')}</p><p className="tabular font-bold">{formatarMinutos(s.trabalhado,false)} / {formatarMinutos(s.meta,false)}</p></div><div><p className="text-xs text-muted-foreground">{t('Saldo da semana')}</p><p className="tabular font-bold">{formatarMinutos(s.saldo)}</p></div></div>:<p role="status">{t('Carregando…')}</p>}</section>;}
