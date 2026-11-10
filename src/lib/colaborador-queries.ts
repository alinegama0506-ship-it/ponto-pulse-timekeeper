import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from './queries';
export function useMinhasMarcacoes(){const me=useMe();const uid=me.data?.user.id;return useQuery({queryKey:['marcacoes',uid],enabled:!!uid,queryFn:async()=>{const {data,error}=await supabase.from('marcacoes').select('*').eq('user_id',uid!).order('momento_dispositivo',{ascending:false}).limit(500);if(error)throw error;return data;}});}
export function useMinhasSolicitacoes(){const me=useMe();const uid=me.data?.user.id;return useQuery({queryKey:['solicitacoes',uid],enabled:!!uid,queryFn:async()=>{const {data,error}=await supabase.from('solicitacoes').select('*').eq('user_id',uid!).order('created_at',{ascending:false}).limit(50);if(error)throw error;return data;}});}
