import { createFileRoute } from '@tanstack/react-router';
import { pageHead } from '@/lib/metadata';
import { useT } from '@/lib/i18n';
export const Route=createFileRoute('/_authenticated/sobre')({head:()=>pageHead('Sobre o aplicativo','Versão e limites de uso do Ponto Inteligente.'),component:Sobre});
function Sobre(){const {t}=useT();return <article className="mx-auto max-w-3xl space-y-4"><h1 className="text-2xl font-bold">{t('Sobre o aplicativo e versão')}</h1><h2 className="text-xl font-bold">Ponto Inteligente</h2><p>Versão 0.2 · Fase 2</p><p lang="pt-BR">Controle interno de jornada. Não é apresentado como REP-P certificado. A utilização como registro legal depende da verificação dos requisitos da Portaria MTP 671/2021 e da orientação da empresa, do contador ou do jurídico.</p></article>;}
