import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe, useNow } from '@/lib/queries';
import { IdiomaContext, useT } from '@/lib/i18n';
import { aplicarPreferencias, normalizarAcessibilidade, normalizarIdioma, lembreteDevido, type Idioma, type Acessibilidade } from '@/lib/preferencias';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
type Preferencias = { idioma: Idioma; a: Acessibilidade; salvar:(v:{idioma?:Idioma;acessibilidade?:Acessibilidade;notificacoes?:Json})=>Promise<void>; salvando:boolean };
const Context=createContext<Preferencias | null>(null);
export function usePreferencias(){ const c=useContext(Context); if(!c) throw new Error('Preferências indisponíveis'); return c; }
export function PreferenciasProvider({children}:{children:ReactNode}){
 const me=useMe(); const qc=useQueryClient(); const [salvando,setSalvando]=useState(false); const [aplicado,setAplicado]=useState(false);
 const [local,setLocal]=useState<{idioma?:Idioma;a?:Acessibilidade}>({});
 const idioma=local.idioma ?? normalizarIdioma(me.data?.profile?.idioma); const a=local.a ?? normalizarAcessibilidade(me.data?.profile?.acessibilidade);
 const serial=JSON.stringify(a);
 useLayoutEffect(()=>{ if(!me.data) return; aplicarPreferencias(a,idioma);setAplicado(true); },[me.data,serial,idioma]);
 useEffect(()=>{ const m=window.matchMedia('(prefers-color-scheme: dark)');const cb=()=>aplicarPreferencias(a,idioma);m.addEventListener('change',cb);return()=>m.removeEventListener('change',cb); },[serial,idioma]);
 const salvar:Preferencias['salvar']=async v=>{
  if(!me.data) return;
  const anterior=local; setLocal({...local,...(v.idioma ? {idioma:v.idioma}:{}),...(v.acessibilidade ? {a:v.acessibilidade}:{})});setSalvando(true);
  try { const {error}=await supabase.from('profiles').update(v).eq('id',me.data.user.id);if(error) throw error;await qc.invalidateQueries({queryKey:['me']}); }
  catch {setLocal(anterior);toast.error('Não foi possível salvar as preferências.');throw new Error('Não foi possível salvar as preferências.');}
  finally {setSalvando(false);}
 };
 if(me.isError) return <div className="grid min-h-screen place-content-center gap-4"><p role="alert">Não foi possível carregar a conta.</p><Button onClick={()=>void me.refetch()}>Tentar de novo</Button></div>;
 if(!me.data || !aplicado) return <div role="status" className="grid min-h-screen place-items-center">Carregando…</div>;
 return <Context.Provider value={{idioma,a,salvar,salvando}}><IdiomaContext.Provider value={idioma}>{children}<Lembrete/><VLibras ativo={a.vlibras}/></IdiomaContext.Provider></Context.Provider>;
}
function Lembrete(){const me=useMe();const now=useNow();const {t}=useT();useEffect(()=>{const n=me.data?.profile?.notificacoes as {ativo?:boolean;horario?:string}|undefined;if(!now||!n) return;const chave=`lembrete-${me.data?.user.id}-${now.toLocaleDateString()}-${n.horario}`;if(lembreteDevido(n.ativo===true,n.horario??'09:00',now)&&!sessionStorage.getItem(chave)){sessionStorage.setItem(chave,'1');toast.info(t('Hora de registrar o ponto.'));}},[now,me.data,t]);return null;}
function VLibras({ativo}:{ativo:boolean}){
 const [erro,setErro]=useState(false);
 useEffect(()=>{
  if(!ativo)return;let cancelado=false;setErro(false);
  const iniciar=()=>{const w=window as unknown as {VLibras?:{Widget:new(url:string)=>unknown}};if(!cancelado&&w.VLibras)new w.VLibras.Widget('https://vlibras.gov.br/app');};
  const existente=document.getElementById('vlibras-script');
  if(existente){iniciar();return;}
  const script=document.createElement('script');script.id='vlibras-script';script.src='https://vlibras.gov.br/app/vlibras-plugin.js';script.onload=iniciar;script.onerror=()=>setErro(true);document.body.append(script);
  return()=>{cancelado=true;};
 },[ativo]);
 if(!ativo)return null;
 return <div {...{vw:''}} className="enabled" aria-label="VLibras"><div {...{'vw-access-button':''}}/><div {...{'vw-plugin-wrapper':''}}><div className="vw-plugin-top-wrapper"/></div>{erro&&<p role="alert">VLibras indisponível no momento.</p>}</div>;
}
