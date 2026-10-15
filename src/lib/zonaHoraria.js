// Regla de zona horaria compartida (misma que la vista ranking_hamburguesas).
// Un solo lugar para AlertasFraude y el CSV interno.

export const ZONA = 'America/Caracas';
export const ZONAS_SIN_DATO = ['UTC', 'Etc/UTC']; // navegadores de privacidad: cuentan como sin dato

// Zona vacia, UTC o America/Caracas no es "fuera de zona".
export function fueraDeZona(zona) {
  return Boolean(zona) && zona !== ZONA && !ZONAS_SIN_DATO.includes(zona);
}
