export type Idioma = 'pt-BR' | 'en' | 'es';
export type Acessibilidade = { tamanho: 100 | 115 | 130 | 150; tema: 'claro' | 'escuro' | 'sistema'; contraste: boolean; reduzir: boolean; espacamento: boolean; foco: boolean; fonte: boolean; vlibras: boolean };
export const PADRAO: Acessibilidade = { tamanho: 100, tema: 'sistema', contraste: false, reduzir: false, espacamento: false, foco: false, fonte: false, vlibras: false };
export function normalizarAcessibilidade(valor: unknown): Acessibilidade {
 const v = valor && typeof valor === 'object' ? valor as Record<string, unknown> : {};
 return { tamanho: [100,115,130,150].includes(Number(v.tamanho)) ? Number(v.tamanho) as Acessibilidade['tamanho'] : 100, tema: ['claro','escuro','sistema'].includes(String(v.tema)) ? v.tema as Acessibilidade['tema'] : 'sistema', contraste:v.contraste === true, reduzir:v.reduzir === true, espacamento:v.espacamento === true, foco:v.foco === true, fonte:v.fonte === true, vlibras:v.vlibras === true };
}
export function normalizarIdioma(v: unknown): Idioma { return v === 'en' || v === 'es' ? v : 'pt-BR'; }
export function aplicarPreferencias(a: Acessibilidade, idioma: Idioma) {
 const h=document.documentElement; h.lang=idioma;
 h.dataset.tamanho=String(a.tamanho);
 h.classList.toggle('dark', a.tema === 'escuro' || (a.tema === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches));
 for (const k of ['contraste','reduzir','espacamento','foco','fonte'] as const) h.classList.toggle(`a11y-${k}`,a[k]);
}
export function celulaCSV(v: unknown) { const s=String(v ?? ''); return `"${(/^[=+@\-\t\r]/.test(s) ? "'" : '') + s.replaceAll('"','""')}"`; }
export function paraCSV(rows: Record<string, unknown>[]) { const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))]; return '\ufeff'+[keys.map(celulaCSV).join(';'),...rows.map(r=>keys.map(k=>celulaCSV(typeof r[k] === 'object' && r[k] !== null ? JSON.stringify(r[k]) : r[k])).join(';'))].join('\r\n'); }
export function lembreteDevido(ativo: boolean, horario: string, agora: Date) { return ativo && `${String(agora.getHours()).padStart(2,'0')}:${String(agora.getMinutes()).padStart(2,'0')}` === horario; }
