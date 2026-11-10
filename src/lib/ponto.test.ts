import { describe, expect, it } from "vitest";
import { capturarMomentoLocal, proximoTipo, saldoBanco, validarSolicitacao, type MarcacaoLite } from "./ponto";

const regras = { jornada_diaria_min: 480, tolerancia_min: 10, limite_diario_min: 600, validade_banco_dias: 180 };
const m = (tipo: MarcacaoLite["tipo"], iso: string): MarcacaoLite => ({ user_id: "u", tipo, data_local: "2026-11-10", momento_dispositivo: iso });

describe("ponto", () => {
  it("captures the device time of the click, not a fixed value", () => {
    const d = new Date(2026, 10, 10, 13, 20, 5);
    const c = capturarMomentoLocal(d);
    expect(c.data_local).toBe("2026-11-10");
    expect(c.hora_local).toBe("13:20:05");
    expect(c.momento_dispositivo).toBe(d.toISOString());
  });

  it("follows punch sequence", () => {
    expect(proximoTipo([])).toBe("entrada");
    expect(proximoTipo(["entrada"])).toBe("saida_intervalo");
    expect(proximoTipo(["entrada", "saida_intervalo", "retorno_intervalo", "saida"])).toBeNull();
  });

  it("requires date, time, type and reason", () => {
    const e = validarSolicitacao({ data_solicitada: "", hora_solicitada: "", tipo: "", motivo: "" }, "2026-11-10");
    expect(Object.keys(e).sort()).toEqual(["data_solicitada", "hora_solicitada", "motivo", "tipo"]);
    expect(validarSolicitacao({ data_solicitada: "2026-11-09", hora_solicitada: "08:00", tipo: "entrada", motivo: "esquecimento" }, "2026-11-10")).toEqual({});
  });

  it("balance counts only recorded punches (9h worked = +1h)", () => {
    const dia = [
      m("entrada", "2026-11-10T08:00:00Z"),
      m("saida_intervalo", "2026-11-10T12:00:00Z"),
      m("retorno_intervalo", "2026-11-10T13:00:00Z"),
      m("saida", "2026-11-10T18:00:00Z"),
    ];
    expect(saldoBanco(dia, regras)).toBe(60);
    // a pending request is not a punch, so an incomplete day stays at 0
    expect(saldoBanco(dia.slice(0, 3), regras)).toBe(0);
  });
});
