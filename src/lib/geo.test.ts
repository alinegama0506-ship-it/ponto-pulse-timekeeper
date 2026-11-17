import { describe, expect, it } from "vitest";
import { distanciaHaversine, podeConfirmarGeo, relogioDivergente, statusGeo } from "./geo";
describe("geolocalização", () => {
  it("calcula a distância Haversine em metros", () => { expect(distanciaHaversine(0,0,0,0)).toBe(0); expect(distanciaHaversine(0,0,0,1)).toBeCloseTo(111194.9266, 3); });
  const base = { modalidade: "presencial", precisao: 100, precisaoMax: 100, distancia: 150, raio: 150 };
  it("inclui a borda do raio padrão de 150m", () => { expect(statusGeo(base)).toBe("dentro"); expect(statusGeo({ ...base, distancia: 150.01 })).toBe("fora"); });
  it("aceita qualquer localização dentro do local cadastrado, mesmo com precisão baixa", () => { expect(statusGeo({ ...base, precisao: 100.01 })).toBe("dentro"); expect(podeConfirmarGeo("dentro", "bloquear", "")).toBe(true); });
  it("marca precisão acima de 100m como baixa quando está fora do local", () => { expect(statusGeo({ ...base, distancia: 151, precisao: 100.01 })).toBe("precisao_baixa"); });
  it("preserva falhas de permissão", () => { expect(statusGeo({ ...base, precisao: null, falha: "sem_permissao" })).toBe("sem_permissao"); });
  it("não bloqueia externo e remoto", () => { for (const modalidade of ["externo","remoto"]) expect(statusGeo({ ...base, modalidade, precisao: null })).toBe("dispensado"); });
  it("bloquear recusa fora e sem localização", () => { expect(podeConfirmarGeo("fora","bloquear","justificativa completa")).toBe(false); expect(podeConfirmarGeo("indisponivel","bloquear","")).toBe(false); });
  it("justificar exige dez caracteres", () => { expect(podeConfirmarGeo("fora","justificar","123456789")).toBe(false); expect(podeConfirmarGeo("fora","justificar","1234567890")).toBe(true); });
  it("apenas registrar aceita falhas", () => { expect(podeConfirmarGeo("sem_permissao","apenas_registrar","")).toBe(true); });
  it("divergência só alerta acima de 300 segundos em ambos sentidos", () => { expect(relogioDivergente(300,300)).toBe(false); expect(relogioDivergente(301,300)).toBe(true); expect(relogioDivergente(-301,300)).toBe(true); });
});