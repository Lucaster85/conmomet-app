// El aguinaldo (SAC) se liquida como un PayPeriod más, de tipo `sac` (uno por semestre, month = 6 | 12).
// Estos helpers concentran cómo se nombra y se distingue, para que ninguna pantalla asuma
// "período = quincena" (ver PLAN_SAC.md §7).
type PeriodLike = { type: string; month: number; year: number };

export const isSacPeriod = (p?: { type?: string } | null): boolean => p?.type === 'sac';

/** 1 para ene–jun, 2 para jul–dic. */
export const sacSemester = (month: number): 1 | 2 => (month <= 6 ? 1 : 2);

const ordinal = (semester: 1 | 2) => (semester === 1 ? '1er' : '2do');

/** "Aguinaldo (SAC) 1er semestre 2026" */
export const sacPeriodLabel = (p: PeriodLike): string =>
  `Aguinaldo (SAC) ${ordinal(sacSemester(p.month))} semestre ${p.year}`;

/** "SAC 1er sem. 2026" — para selectores y etiquetas cortas. */
export const sacShortLabel = (p: PeriodLike): string =>
  `SAC ${ordinal(sacSemester(p.month))} sem. ${p.year}`;

/** Vencimiento legal de la cuota (Ley 27.073 / art. 128 LCT), solo informativo. */
export const sacDueNotice = (month: number): string =>
  sacSemester(month) === 1
    ? 'Vencimiento legal: 30/06, más 4 días hábiles de gracia.'
    : 'Vencimiento legal: 18/12, más 4 días hábiles de gracia (hasta ~22/12).';

/** Fecha desde la que se puede generar el aguinaldo: inicio de la 2Q del mes de cierre (día 16). */
export const sacGenerateFrom = (p: { month: number; year: number }): string =>
  `${p.year}-${String(p.month).padStart(2, '0')}-16`;

// La liquidación final de los egresos (PLAN_EGRESOS.md §6.1) también es un PayPeriod, de tipo `final`:
// uno por mes, con una entry por cada empleado que egresó ese mes. No se genera, cierra ni paga en
// bloque: cada entry se confirma y se paga por separado.
export const isFinalPeriod = (p?: { type?: string } | null): boolean => p?.type === 'final';

const FINAL_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "Liquidaciones finales — noviembre 2026" */
export const finalPeriodLabel = (p: { month: number; year: number }): string =>
  `Liquidaciones finales — ${FINAL_MONTHS[p.month - 1]} ${p.year}`;

/** "Liquidación final nov-2026" — para selectores y etiquetas cortas. */
export const finalPeriodShortLabel = (p: { month: number; year: number }): string =>
  `Liquidación final ${FINAL_MONTHS[p.month - 1].slice(0, 3)}-${p.year}`;

/** Líneas que van en "Indemnizatorio / no remunerativo" del recibo; el resto es remunerativo. */
export const FINAL_INDEMNITY_LINE_TYPES = ['notice_pay', 'notice_pay_sac', 'month_integration', 'month_integration_sac', 'severance', 'severance_agreed'];

/** Líneas propias de la liquidación final (para reconocer una entry final por sus líneas). */
export const FINAL_LINE_TYPES = [
  'final_days', 'sac_proportional', 'vacation_unused', 'vacation_unused_sac', 'notice_pay', 'notice_pay_sac',
  'month_integration', 'month_integration_sac', 'severance', 'severance_agreed', 'overpaid_deduction', 'employee_notice_deduction',
];
