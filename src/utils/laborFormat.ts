import { BudgetItemType, BudgetLaborLine } from './api';

// Un rubro por días (BudgetItemType.unit_type === 'days') se carga y se cotiza en días, y cada día
// vale HOURS_PER_DAY horas en la bolsa de horas del proyecto. El valor se guarda en cada línea
// (hours_per_day); esta constante solo se usa para las líneas nuevas que todavía no se guardaron.
// Debe coincidir con HOURS_PER_DAY de api_conmomet/helpers/laborUnits.js.
export const HOURS_PER_DAY = 9;

export const UNIT_TYPE_LABELS: Record<BudgetItemType['unit_type'], string> = {
  hours: 'Horas',
  units: 'Unidades',
  days: `Días (${HOURS_PER_DAY} hs por día)`,
};

export const hoursPerDayFor = (itemType?: Pick<BudgetItemType, 'unit_type'> | null): number | null =>
  itemType?.unit_type === 'days' ? HOURS_PER_DAY : null;

const formatNumber = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 2 });

// Horas por unidad de la línea: el valor guardado, o — en una línea nueva sin guardar — el que
// corresponde al rubro. Una línea guardada con null cuenta como horas (ej. era de un rubro por
// horas que después pasó a días).
export const lineHoursPerDay = (line: Pick<BudgetLaborLine, 'id' | 'hours_per_day'>, itemType?: Pick<BudgetItemType, 'unit_type'> | null): number | null => {
  if (line.hours_per_day !== null && line.hours_per_day !== undefined) return Number(line.hours_per_day);
  return line.id === undefined || line.id === null ? hoursPerDayFor(itemType) : null;
};

export const formatHours = (hours: number) => `${formatNumber(hours)} hs`;

// Horas cotizadas de la línea (en un rubro por días: días × 9).
export const laborLineHours = (line: BudgetLaborLine, itemType?: BudgetItemType | null): number => {
  const type = itemType ?? line.itemType;
  return Number(line.quantity || 0) * (lineHoursPerDay(line, type) ?? 1);
};

// "2 días (18 hs)", "20 hs", o la etiqueta del rubro (ej. "3 u"). Lo usan el formulario, la vista,
// el detalle y el proyecto, para que se vea igual en todos lados.
export const formatLaborQuantity = (line: BudgetLaborLine, itemType?: BudgetItemType | null): string => {
  const type = itemType ?? line.itemType;
  const quantity = Number(line.quantity || 0);
  const perDay = lineHoursPerDay(line, type);
  if (perDay) return `${formatNumber(quantity)} ${quantity === 1 ? 'día' : 'días'} (${formatNumber(quantity * perDay)} hs)`;
  // Línea guardada de un rubro que hoy es por días pero no tiene hours_per_day: ya eran horas.
  const label = type?.unit_type === 'days' ? 'hs' : (type?.unit_label || 'hs');
  return `${formatNumber(quantity)} ${label}`;
};
