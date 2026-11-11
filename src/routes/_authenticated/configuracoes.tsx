import { createFileRoute } from '@tanstack/react-router';
import { Configuracoes } from '@/components/conta/Configuracoes';
import { useT } from '@/lib/i18n';
import { pageHead } from '@/lib/metadata';
export const Route=createFileRoute('/_authenticated/configuracoes')({head:()=>pageHead('Configurações','Perfil, privacidade, notificações e senha da conta.'),component:Pagina});
function Pagina(){const {t}=useT();return <div className="mx-auto max-w-2xl"><h1 className="mb-5 text-2xl font-bold">{t('Configurações')}</h1><Configuracoes/></div>;}
