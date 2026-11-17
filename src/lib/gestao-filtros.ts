import {useNavigate,useSearch} from '@tanstack/react-router';
import {dataLocalHoje,deslocarData} from './ponto';
import {z} from 'zod';
import {zodValidator} from '@tanstack/zod-adapter';
export const validarFiltrosGestao=zodValidator(z.object({de:z.string().optional(),ate:z.string().optional(),equipe:z.string().optional(),local:z.string().optional(),colab:z.string().optional(),status:z.string().optional(),indicador:z.string().optional()}));
export function filtrosGestao(search:Record<string,unknown>){
 const data=(v:unknown,padrao:string)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))?v:padrao;
 const de=data(search['de'],deslocarData(dataLocalHoje(),-29));const ate=data(search['ate'],dataLocalHoje());
 return {de:de<=ate?de:ate,ate,equipe:typeof search['equipe']==='string'?search['equipe']:'todos',local:typeof search['local']==='string'?search['local']:'todos',colab:typeof search['colab']==='string'?search['colab']:'todos',status:typeof search['status']==='string'?search['status']:'pendente',indicador:typeof search['indicador']==='string'?search['indicador']:'todos'};
}
export type FiltrosGestao=ReturnType<typeof filtrosGestao>;
export function useFiltrosGestao(to:'/gestor/dashboard'|'/gestor/operacao'|'/gestor/equipe'){
 const raw=useSearch({strict:false});const value=filtrosGestao(raw);const nav=useNavigate();
 return {value,onChange:(patch:Partial<FiltrosGestao>)=>{void nav({to,search:{...value,...patch},replace:true});}};
}