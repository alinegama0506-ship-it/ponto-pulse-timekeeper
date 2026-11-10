import { useT } from '@/lib/i18n';
import { usePreferencias } from './PreferenciasProvider';
import { PADRAO, type Acessibilidade as Pref } from '@/lib/preferencias';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
export function Acessibilidade(){const {t}=useT();const {a,salvar,salvando}=usePreferencias();const mudar=(v:Partial<Pref>)=>void salvar({acessibilidade:{...a,...v}}).catch(()=>{});
return <div className="mx-auto grid max-w-2xl gap-5"><h1 className="text-2xl font-bold">{t('Acessibilidade')}</h1>
<div className="grid gap-2"><Label htmlFor="texto">{t('Tamanho do texto')}</Label><Select value={String(a.tamanho)} onValueChange={v=>mudar({tamanho:Number(v) as Pref['tamanho']})} disabled={salvando}><SelectTrigger id="texto" className="min-h-11"><SelectValue/></SelectTrigger><SelectContent>{[100,115,130,150].map(v=><SelectItem key={v} value={String(v)}>{v}%</SelectItem>)}</SelectContent></Select></div>
<div className="grid gap-2"><Label htmlFor="tema">{t('Tema')}</Label><Select value={a.tema} onValueChange={v=>mudar({tema:v as Pref['tema']})} disabled={salvando}><SelectTrigger id="tema" className="min-h-11"><SelectValue/></SelectTrigger><SelectContent>{[['claro','Claro'],['escuro','Escuro'],['sistema','Sistema']].map(([v,l])=><SelectItem key={v} value={v??''}>{t(l??'')}</SelectItem>)}</SelectContent></Select></div>
{([['contraste','Alto contraste'],['reduzir','Reduzir animações'],['espacamento','Mais espaçamento entre linhas'],['foco','Foco reforçado'],['fonte','Fonte legível'],['vlibras','Ativar VLibras (Libras)']] as const).map(([k,l])=><div key={k} className="flex min-h-11 items-center justify-between gap-4 border-b py-2"><Label htmlFor={`a-${k}`}>{t(l)}</Label><Switch id={`a-${k}`} className="min-h-6 min-w-11" checked={a[k]} disabled={salvando} onCheckedChange={v=>mudar({[k]:v})}/></div>)}
<Button variant="outline" className="min-h-11" disabled={salvando} onClick={()=>void salvar({acessibilidade:PADRAO}).catch(()=>{})}>{t('Restaurar padrão')}</Button>
</div>;}
