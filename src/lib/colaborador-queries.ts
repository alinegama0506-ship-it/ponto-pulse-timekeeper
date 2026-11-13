import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from './queries';
export function useMinhasMarcacoes(){const me=useMe();const uid=me.data?.user.id;return useQuery({queryKey:['marcacoes',uid],enabled:!!uid,queryFn:async()=>{if(!uid)throw new Error('Sessão expirada');const {data,error}=await supabase.from('marcacoes').select('*').eq('user_id',uid).order('momento_dispositivo',{ascending:false}).limit(500);if(error)throw error;return data;}});}
export function useMinhasSolicitacoes(){const me=useMe();const uid=me.data?.user.id;return useQuery({queryKey:['solicitacoes',uid],enabled:!!uid,queryFn:async()=>{if(!uid)throw new Error('Sessão expirada');const {data,error}=await supabase.from('solicitacoes').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(50);if(error)throw error;return data;}});}

/** Scoped, paginated reads for a selected week and its comparison week. */
export function usePeriodoSemana(inicio: string, fim: string) {
 const me=useMe();const uid=me.data?.user.id;
 return useQuery({queryKey:['marcacoes','semana',uid,inicio,fim],enabled:!!uid,queryFn:async()=>{
  if(!uid)throw new Error('Sessão expirada');
  const marcacoes=[]; const solicitacoes=[];
  for(let offset=0;;offset+=500){const {data,error}=await supabase.from('marcacoes').select('*').eq('user_id',uid).gte('data_local',inicio).lte('data_local',fim).order('data_local').order('id').range(offset,offset+499);if(error)throw error;marcacoes.push(...(data??[]));if((data?.length??0)<500)break;}
  for(let offset=0;;offset+=500){const {data,error}=await supabase.from('solicitacoes').select('*').eq('user_id',uid).gte('data_solicitada',inicio).lte('data_solicitada',fim).order('id').range(offset,offset+499);if(error)throw error;solicitacoes.push(...(data??[]));if((data?.length??0)<500)break;}
  return {marcacoes,solicitacoes};
 }});
}
export function useBancoCompleto(){const me=useMe();const uid=me.data?.user.id;return useQuery({queryKey:['marcacoes','banco',uid],enabled:!!uid,queryFn:async()=>{if(!uid)throw new Error('Sessão expirada');const rows=[];for(let offset=0;;offset+=500){const {data,error}=await supabase.from('marcacoes').select('*').eq('user_id',uid).order('id').range(offset,offset+499);if(error)throw error;rows.push(...(data??[]));if((data?.length??0)<500)break;}return rows;}});}
