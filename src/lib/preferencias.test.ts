import { describe,it,expect } from 'vitest';
import { normalizarAcessibilidade, normalizarIdioma, paraCSV, lembreteDevido } from './preferencias';
describe('Preferências da conta',()=>{
 it('aceita os quatro tamanhos solicitados',()=>{ for(const tamanho of [100,115,130,150]) expect(normalizarAcessibilidade({tamanho}).tamanho).toBe(tamanho); expect(normalizarAcessibilidade({tamanho:200}).tamanho).toBe(100); });
 it('aceita claro, escuro e sistema',()=>{ for(const tema of ['claro','escuro','sistema']) expect(normalizarAcessibilidade({tema}).tema).toBe(tema); expect(normalizarAcessibilidade({tema:'outro'}).tema).toBe('sistema'); });
 it('restaura os valores padrão sem preferências',()=>{ expect(normalizarAcessibilidade(null)).toEqual({tamanho:100,tema:'sistema',contraste:false,reduzir:false,espacamento:false,foco:false,fonte:false,vlibras:false}); });
 it('usa português por padrão e aceita inglês e espanhol',()=>{ expect(normalizarIdioma(null)).toBe('pt-BR'); expect(normalizarIdioma('en')).toBe('en'); expect(normalizarIdioma('es')).toBe('es'); });
 it('lembrete depende de ativação e horário exato',()=>{ const now=new Date(2026,10,10,9,0); expect(lembreteDevido(true,'09:00',now)).toBe(true); expect(lembreteDevido(false,'09:00',now)).toBe(false); expect(lembreteDevido(true,'10:00',now)).toBe(false); });
 it('exporta caracteres especiais sem executar fórmulas',()=>{ const csv=paraCSV([{nome:'=1+1',observacao:'a"b;c'}]); expect(csv).toContain('"\'=1+1"'); expect(csv).toContain('"a""b;c"'); });
});
