import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {toast} from 'sonner';
import {Download} from 'lucide-react';
import {supabase} from '@/integrations/supabase/client';
import type {Tables} from '@/integrations/supabase/types';
import {dataLocalHoje,folhaMensal,TIPOS,TIPO_LABEL,formatarData,formatarMinutos} from '@/lib/ponto';
import {useRegras,useMe} from '@/lib/queries';
import {baixarFolhaPDF} from '@/lib/folha-pdf';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
export function FolhaMensal({userId,gestor=false}:{userId:string;gestor?:boolean}){
 const me=useMe();const regras=useRegras();const [mes,setMes]=useState(dataLocalHoje().slice(0,7));const [gerando,setGerando]=useState(false);
 const valido=/^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
 const query=useQuery({queryKey:['marcacoes','folha',userId,mes],enabled:!!userId&&valido,queryFn:async()=>{
  if(!gestor&&userId!==me.data?.user.id)throw new Error('Acesso não autorizado');
  const {data:perfil,error}=await supabase.from('profiles').select('nome,email,cargo').eq('id',userId).single();if(error)throw error;
  const marcacoes:Tables<'marcacoes'>[]=[];const solicitacoes:Tables<'solicitacoes'>[]=[];const de=`${mes}-01`;const [ano,n]=mes.split('-').map(Number);const ate=`${mes}-${new Date(ano??0,n??1,0).getDate()}`;
  for(let i=0;;i+=500){const {data,error}=await supabase.from('marcacoes').select('*').eq('user_id',userId).gte('data_local',de).lte('data_local',ate).order('id').range(i,i+499);if(error)throw error;marcacoes.push(...data);if(data.length<500)break;}
  for(let i=0;;i+=500){const {data,error}=await supabase.from('solicitacoes').select('*').eq('user_id',userId).gte('data_solicitada',de).lte('data_solicitada',ate).order('id').range(i,i+499);if(error)throw error;solicitacoes.push(...data);if(data.length<500)break;}
  return {perfil,marcacoes,solicitacoes};
 }});
 const folha=query.data&&regras.data?folhaMensal(mes,userId,query.data.marcacoes,query.data.solicitacoes,regras.data):null;
 return <section className="mt-6 grid min-w-0 gap-4 border-t pt-5"><div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-lg font-bold">Folha de ponto mensal</h2><div className="flex flex-wrap items-end gap-3"><div className="grid gap-1"><Label htmlFor="folha-mes">Mês</Label><Input id="folha-mes" type="month" required value={mes} className="h-11 w-44" onChange={e=>{if(e.target.value)setMes(e.target.value);}}/></div><Button className="min-h-11" disabled={!folha||gerando||query.isError} onClick={async()=>{if(!folha||!query.data)return;setGerando(true);try{await baixarFolhaPDF(query.data.perfil.nome,query.data.perfil.email,query.data.perfil.cargo,mes,folha);}catch{toast.error('Não foi possível gerar o PDF.');}finally{setGerando(false);}}}><Download className="size-4"/>{gerando?'Gerando…':'Salvar PDF'}</Button></div></div>
 {query.isPending||regras.isPending?<p role="status">Carregando folha…</p>:query.isError||regras.isError?<p role="alert">Não foi possível carregar a folha. <Button variant="outline" className="min-h-11" onClick={()=>{void query.refetch();void regras.refetch();}}>Tentar de novo</Button></p>:folha&&<><p className="font-medium">{query.data?.perfil.nome} · Trabalhado {formatarMinutos(folha.trabalhado,false)} · Saldo {formatarMinutos(folha.saldo)}</p>{!query.data?.marcacoes.length&&<p className="text-sm text-muted-foreground">Sem marcações neste mês.</p>}<div className="max-h-[520px] overflow-auto"><table className="w-full min-w-[720px] text-sm"><caption className="sr-only">Marcações e totais de todos os dias do mês</caption><thead className="sticky top-0 bg-card"><tr><th scope="col" className="py-3 text-left">Data</th>{TIPOS.map(t=><th scope="col" key={t}>{TIPO_LABEL[t]}</th>)}<th scope="col">Trabalhado</th><th scope="col">Saldo</th><th scope="col">Ocorrências</th></tr></thead><tbody className="divide-y">{folha.dias.map(d=><tr key={d.data}><th scope="row" className="py-3 text-left font-medium">{formatarData(d.data)}</th>{TIPOS.map(t=><td key={t} className="text-center tabular">{d.marc.find(m=>m.tipo===t)?.hora_local?.slice(0,5)??'—'}</td>)}<td className="text-center tabular">{formatarMinutos(d.trabalhado,false)}</td><td className="text-center tabular">{formatarMinutos(d.saldo)}</td><td className="text-center">{d.status}{d.pendente?' · Ajuste pendente':''}</td></tr>)}</tbody></table></div><p className="text-xs text-muted-foreground">Horários locais do dispositivo. Solicitações pendentes não alteram o saldo.</p></>}
 </section>;
}