// CUIT argentino: 11 dígitos, el último es verificador (módulo 11). Se guarda sin guiones y se
// muestra como XX-XXXXXXXX-X. El backend valida lo mismo (api_conmomet/helpers/cuit.js): acá es
// solo para avisar antes de enviar.

const MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

// Máscara mientras se escribe: "30703088534" -> "30-70308853-4".
export function maskCuit(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

export function formatCuit(value?: string | null): string {
  return value ? maskCuit(value) : '';
}

export function isValidCuit(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 11) return false;
  const sum = MULTIPLIERS.reduce((acc, m, i) => acc + m * Number(d[i]), 0);
  const remainder = 11 - (sum % 11);
  if (remainder === 10) return false;
  return (remainder === 11 ? 0 : remainder) === Number(d[10]);
}

export type TaxCondition = 'responsable_inscripto' | 'monotributo' | 'exento' | 'consumidor_final' | 'no_responsable';

export const TAX_CONDITION_LABELS: Record<TaxCondition, string> = {
  responsable_inscripto: 'Responsable Inscripto',
  monotributo: 'Monotributo',
  exento: 'IVA Exento',
  consumidor_final: 'Consumidor Final',
  no_responsable: 'IVA No Responsable',
};
