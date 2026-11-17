import {createFileRoute} from '@tanstack/react-router';
import {FolhaMensal} from '@/components/ponto/FolhaMensal';
import {useMe} from '@/lib/queries';
import {pageHead} from '@/lib/metadata';
export const Route=createFileRoute('/_authenticated/colaborador/folha')({head:()=>pageHead('Minha folha de ponto','Consulte suas marcações mensais e salve sua folha de ponto em PDF.'),component:Pagina});
function Pagina(){const me=useMe();return <div className="min-w-0"><h1 className="text-2xl font-bold">Minha folha de ponto</h1>{me.data?<FolhaMensal userId={me.data.user.id}/>:<p role="status">Carregando…</p>}</div>;}