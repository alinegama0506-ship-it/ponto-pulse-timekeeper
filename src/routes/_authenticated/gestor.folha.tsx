import {createFileRoute} from '@tanstack/react-router';
import {FolhaPonto} from '@/components/ponto/FolhaPonto';
import {pageHead} from '@/lib/metadata';
export const Route=createFileRoute('/_authenticated/gestor/folha')({head:()=>pageHead('Folha de ponto da equipe','Consulte e baixe a folha de ponto por colaborador e período.'),component:()=> <FolhaPonto gestor/>});