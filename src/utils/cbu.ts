// CBU argentino: 22 dígitos con dos dígitos verificadores. El backend valida lo mismo
// (api_conmomet/helpers/cbu.js): acá es solo para avisar antes de enviar.

const BLOCK1_WEIGHTS = [7, 1, 3, 9, 7, 1, 3];
const BLOCK2_WEIGHTS = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

export const cbuDigits = (value: string): string => value.replace(/\D/g, '').slice(0, 22);

const checkDigit = (digits: string, weights: number[]): number =>
  (10 - (weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0) % 10)) % 10;

export function isValidCbu(value: string): boolean {
  const cbu = cbuDigits(value);
  if (cbu.length !== 22) return false;
  return checkDigit(cbu.slice(0, 7), BLOCK1_WEIGHTS) === Number(cbu[7]) && checkDigit(cbu.slice(8, 21), BLOCK2_WEIGHTS) === Number(cbu[21]);
}

export function validateCbu(value: string): string | null {
  const cbu = cbuDigits(value);
  if (!cbu) return 'El CBU es obligatorio';
  if (cbu.length !== 22) return 'Debe tener 22 dígitos';
  if (!isValidCbu(cbu)) return 'Los dígitos verificadores no coinciden';
  return null;
}

// "0170099220000067797370" -> "01700992 20000067797370" (los dos bloques, como se ve en el home banking).
export function formatCbu(value?: string | null): string {
  const cbu = value ? cbuDigits(value) : '';
  return cbu.length === 22 ? `${cbu.slice(0, 8)} ${cbu.slice(8)}` : cbu;
}

export function validateCbuAlias(value: string): string | null {
  if (!value.trim()) return null;
  return /^[A-Za-z0-9.-]{6,20}$/.test(value.trim()) ? null : 'Entre 6 y 20 caracteres: letras, números, punto o guion';
}
