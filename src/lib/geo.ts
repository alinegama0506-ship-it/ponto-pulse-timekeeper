export const GEO_LABEL = { dentro: "Dentro da área", fora: "Fora da área", precisao_baixa: "Precisão baixa", sem_permissao: "Permissão negada", indisponivel: "Localização indisponível", dispensado: "Dispensado" } as const;
export type GeoStatus = keyof typeof GEO_LABEL;
export type GeoModo = "bloquear" | "justificar" | "apenas_registrar";
export const MODALIDADES = { presencial: "Presencial", hibrido: "Híbrido", externo: "Externo", remoto: "Remoto" } as const;
export interface GeoResultado { geo_status: GeoStatus; local_id: string | null; local_nome: string | null; distancia_m: number | null; geo_modo: GeoModo; precisao_max_m: number; modalidade: keyof typeof MODALIDADES }
export function distanciaHaversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (v: number) => v * Math.PI / 180;
  const a = Math.sin(rad(lat2-lat1)/2)**2 + Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(rad(lng2-lng1)/2)**2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}
export function statusGeo({ modalidade, precisao, precisaoMax, distancia, raio, falha = "indisponivel" }: { modalidade: string; precisao: number | null; precisaoMax: number; distancia: number | null; raio: number | null; falha?: "sem_permissao" | "indisponivel" }): GeoStatus {
  if (modalidade === "externo" || modalidade === "remoto") return "dispensado";
  if (precisao === null) return falha;
  if (distancia !== null && raio !== null && distancia <= raio) return "dentro";
  if (precisao > precisaoMax) return "precisao_baixa";
  return "fora";
}
export function podeConfirmarGeo(status: GeoStatus, modo: GeoModo, justificativa: string) {
  if (status === "dentro" || status === "dispensado") return true;
  return modo === "apenas_registrar" || (modo === "justificar" && justificativa.trim().length >= 10);
}
export function relogioDivergente(divergencia: number | null, limite: number) { return divergencia !== null && Math.abs(divergencia) > limite; }
export function obterPosicao(): Promise<{ latitude: number; longitude: number; precisao_m: number; falha: "indisponivel" | "sem_permissao" }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject({ code: 2 }); return; }
    navigator.geolocation.getCurrentPosition(p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, precisao_m: p.coords.accuracy, falha: "indisponivel" }), reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  });
}