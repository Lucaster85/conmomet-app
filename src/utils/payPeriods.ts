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
