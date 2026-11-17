import {createFileRoute} from '@tanstack/react-router';
import {FolhaPonto} from '@/components/ponto/FolhaPonto';
import {pageHead} from '@/lib/metadata';
export const Route=createFileRoute('/_authenticated/colaborador/folha')({head:()=>pageHead('Minha folha de ponto','Consulte suas marcações e baixe sua folha de ponto em PDF.'),component:FolhaPonto});