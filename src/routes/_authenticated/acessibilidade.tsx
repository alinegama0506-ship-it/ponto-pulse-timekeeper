import { createFileRoute } from '@tanstack/react-router';
import { Acessibilidade } from '@/components/conta/Acessibilidade';
import { pageHead } from '@/lib/metadata';
export const Route=createFileRoute('/_authenticated/acessibilidade')({head:()=>pageHead('Acessibilidade','Preferências de leitura, contraste, movimento e Libras.'),component:Acessibilidade});
