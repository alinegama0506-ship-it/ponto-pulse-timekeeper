import {describe,it,expect} from 'vitest';
import {inicioSemana,deslocarData,resumoSemana,saidaPrevista,intervaloUsado,type MarcacaoSemana} from './ponto';
const regras={jornada_diaria_min:480,tolerancia_min:10,limite_diario_min:600,validade_banco_dias:180};
const dia=(data='2026-11-10',saida='18:00'):MarcacaoSemana[]=>['entrada','saida_intervalo','retorno_intervalo','saida'].map((tipo,i)=>({user_id:'u',tipo:tipo as MarcacaoSemana['tipo'],data_local:data,momento_dispositivo:`${data}T${['08:00','12:00','13:00',saida][i]}:00Z`}));
describe('Visão semanal',()=>{
 it('semana começa na segunda e termina no domingo',()=>{expect(inicioSemana('2026-11-15')).toBe('2026-11-09');expect(deslocarData('2026-11-09',6)).toBe('2026-11-15');expect(inicioSemana('2027-01-01')).toBe('2026-12-28');});
 it('meta provisória é jornada diária vezes cinco',()=>{const s=resumoSemana('2026-11-09',[],[],regras,'2026-11-12');expect(s.meta).toBe(2400);expect(s.dias.map(d=>d.previsto)).toEqual([480,480,480,480,480,0,0]);});
 it('soma somente intervalos de trabalho fechados',()=>{const s=resumoSemana('2026-11-09',dia().slice(0,3),[],regras,'2026-11-10');expect(s.trabalhado).toBe(240);expect(s.saldo).toBe(0);expect(s.dias[1]?.status).toBe('Em andamento');});
 it('solicitação pendente nunca acrescenta horas ou saldo',()=>{const s=resumoSemana('2026-11-09',[],[{data_solicitada:'2026-11-10',status:'pendente'}],regras,'2026-11-12');expect(s.trabalhado).toBe(0);expect(s.saldo).toBe(0);expect(s.dias[1]?.pendente).toBe(true);});
 it('saldo semanal reutiliza tolerância diária vigente',()=>{expect(resumoSemana('2026-11-09',dia('2026-11-10','17:05'),[],regras,'2026-11-12').saldo).toBe(0);expect(resumoSemana('2026-11-09',dia(),[],regras,'2026-11-12').saldo).toBe(60);});
 it('saída prevista soma entrada jornada e intervalo usado',()=>{expect(saidaPrevista(dia().slice(0,3),480,new Date('2026-11-10T14:00Z'))).toBe('2026-11-10T17:00:00.000Z');expect(saidaPrevista(dia(),480,new Date())).toBeNull();});
 it('intervalo aberto considera tempo usado até agora',()=>{expect(intervaloUsado(dia().slice(0,2),new Date('2026-11-10T12:30Z'))).toBe(30);});
 it('não inventa falta ou feriado sem escala',()=>{const s=resumoSemana('2026-11-09',[],[],regras,'2026-11-16');expect(s.dias[0]?.status).toBe('Sem marcações');expect(s.dias[6]?.status).toBe('Folga prevista');});
 it('sinaliza registro fora e intervalo menor que 60 min acima de 6 horas',()=>{const m=dia();m[2]={...m[2] as MarcacaoSemana,momento_dispositivo:'2026-11-10T12:30:00Z',geo_status:'fora'};const d=resumoSemana('2026-11-09',m,[],regras,'2026-11-12').dias[1];expect(d?.fora).toBe(true);expect(d?.intervaloCurto).toBe(true);expect(d?.faltaTipo).toBeNull();});
});
