import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {useEquipes} from '@/lib/gestor-queries';
import {useLocais} from '@/lib/geo-queries';
import type {FiltrosGestao as Filtros} from '@/lib/gestao-filtros';
export function FiltrosGestao({value,onChange}:{value:Filtros;onChange:(patch:Partial<Filtros>)=>void}){const equipes=useEquipes();const locais=useLocais();return <section aria-label="Filtros de gestão" className="mb-6 grid gap-3 border-y py-4 sm:grid-cols-2 lg:grid-cols-4">
 <div className="grid gap-1"><Label htmlFor="gestao-de">De</Label><Input id="gestao-de" type="date" className="h-11" value={value.de} max={value.ate} onChange={e=>onChange({de:e.target.value})}/></div>
 <div className="grid gap-1"><Label htmlFor="gestao-ate">Até</Label><Input id="gestao-ate" type="date" className="h-11" value={value.ate} min={value.de} onChange={e=>onChange({ate:e.target.value})}/></div>
 <div className="grid gap-1"><Label htmlFor="gestao-equipe">Equipe</Label><Select value={value.equipe} onValueChange={equipe=>onChange({equipe})}><SelectTrigger id="gestao-equipe" className="h-11"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todos">Todas as equipes</SelectItem><SelectItem value="sem">Sem equipe</SelectItem>{equipes.data?.map(e=><SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent></Select>{equipes.isError&&<p role="alert">Não foi possível carregar equipes.</p>}</div>
 <div className="grid gap-1"><Label htmlFor="gestao-local">Local</Label><Select value={value.local} onValueChange={local=>onChange({local})}><SelectTrigger id="gestao-local" className="h-11"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="todos">Todos os locais</SelectItem>{locais.data?.map(l=><SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent></Select>{locais.isError&&<p role="alert">Não foi possível carregar locais.</p>}</div>
 </section>;}