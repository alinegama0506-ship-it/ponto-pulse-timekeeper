import { expect, it } from "vitest";
import { normalizarEnderecos } from "./endereco";
it("converte o endereço escolhido em coordenadas sem exigir entrada manual", () => {
  expect(normalizarEnderecos([{ lat: "-3.73", lon: "-38.52", display_name: "Rua Floriano Peixoto, Fortaleza" }])).toEqual([{ latitude: -3.73, longitude: -38.52, endereco: "Rua Floriano Peixoto, Fortaleza" }]);
});
it("não aceita coordenadas inválidas na busca de endereço", () => {
  expect(normalizarEnderecos([{ lat: "91", lon: "0", display_name: "Inválido" }, { lat: "0", lon: "181", display_name: "Inválido" }, { lat: "NaN", lon: "0", display_name: "Inválido" }])).toEqual([]);
});