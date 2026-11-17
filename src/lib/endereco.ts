export interface EnderecoLocalizado { latitude: number; longitude: number; endereco: string }
export function normalizarEnderecos(valor: unknown): EnderecoLocalizado[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item: unknown) => {
    if (!item || typeof item !== "object" || !("lat" in item) || !("lon" in item) || !("display_name" in item)) return [];
    const latitude = Number(item.lat), longitude = Number(item.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || typeof item.display_name !== "string") return [];
    return [{ latitude, longitude, endereco: item.display_name }];
  });
}