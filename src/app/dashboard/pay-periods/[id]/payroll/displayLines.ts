import type { PayrollLine } from '@/utils/api';

// Transformación SOLO VISUAL de las líneas guardadas de una liquidación (FLOWS.md §53). No muta
// `entry.lines` ni toca montos: el backend sigue guardando "Hs Regulares" con todas las horas de
// la semana (feriado incluido) y "Feriado T" como plus a tarifa simple; acá se presentan como
// 32 hs regulares + 8 hs de feriado trabajado al 100% (mismo total).

export interface PeriodHoliday {
  date: string; // YYYY-MM-DD
  name?: string;
}

export type DisplayLine = PayrollLine & { holidayDetail?: string };

const HOURS_PER_HOLIDAY = 8; // el motor liquida 8 hs por cada feriado no trabajado

// "Feriado T" / "Feriado T <concepto>": horas trabajadas en feriado (el plus). No confundir con
// "Feriado NT": ninguna de las dos etiquetas es prefijo de la otra.
export function isWorkedHolidayLine(l: PayrollLine): boolean {
  return l.line_type === 'holiday' && l.label.startsWith('Feriado T');
}

export function isNonWorkedHolidayLine(l: PayrollLine): boolean {
  return l.line_type === 'holiday' && l.label.startsWith('Feriado NT');
}

const formatHoliday = (h: PeriodHoliday): string => {
  const [, mm, dd] = h.date.slice(0, 10).split('-');
  return `${dd}/${mm}${h.name ? ` ${h.name}` : ''}`;
};

const joinHolidays = (hs: PeriodHoliday[]): string | undefined =>
  hs.length > 0 ? hs.map(formatHoliday).join(' · ') : undefined;

/**
 * Qué feriados del período corresponden a las líneas de feriado trabajado y no trabajado de un
 * empleado, sin consultar sus horas: se deduce de cuántos feriados no trabajó (horas "Feriado NT" / 8).
 * Si en la quincena hay más de un feriado y trabajó solo algunos, no se puede saber cuál fue cuál:
 * no se muestra fecha en ninguna de las dos líneas.
 */
function assignHolidayDetails(lines: PayrollLine[], holidays: PeriodHoliday[]) {
  const none = { worked: undefined as string | undefined, nonWorked: undefined as string | undefined };
  if (holidays.length === 0) return none;

  const workedLines = lines.filter(isWorkedHolidayLine);
  const nonWorkedHours = lines.filter(isNonWorkedHolidayLine).reduce((s, l) => s + Number(l.quantity || 0), 0);
  const notWorkedCount = Math.round(nonWorkedHours / HOURS_PER_HOLIDAY);
  const workedCount = holidays.length - notWorkedCount;

  if (notWorkedCount <= 0) {
    // Con varias líneas de feriado trabajado (una por concepto) y varios feriados no se sabe cuál es de cuál.
    const unambiguous = workedLines.length <= 1 || holidays.length === 1;
    return { worked: unambiguous ? joinHolidays(holidays) : undefined, nonWorked: undefined };
  }
  if (workedCount <= 0) return { worked: undefined, nonWorked: joinHolidays(holidays) };
  return none;
}

export function buildDisplayLines(
  lines: PayrollLine[],
  isFixedSalary: boolean,
  periodHolidays: PeriodHoliday[] = []
): DisplayLine[] {
  // Mensualizados y quincenales fijos no generan líneas de extras ni de feriado.
  if (isFixedSalary) return lines;

  const extrasMap: Record<string, { ot50: number; ot100: number }> = {};
  const holidayHoursMap: Record<string, number> = {};
  lines.forEach((l) => {
    const cid = String(l.concept_id || 'null');
    if (l.line_type === 'extras_50' || l.line_type === 'extras_100') {
      if (!extrasMap[cid]) extrasMap[cid] = { ot50: 0, ot100: 0 };
      if (l.line_type === 'extras_50') extrasMap[cid].ot50 += Number(l.quantity || 0);
      else extrasMap[cid].ot100 += Number(l.quantity || 0);
    } else if (isWorkedHolidayLine(l)) {
      holidayHoursMap[cid] = (holidayHoursMap[cid] || 0) + Number(l.quantity || 0);
    }
  });

  const details = assignHolidayDetails(lines, periodHolidays);
  const result: DisplayLine[] = [];

  lines.forEach((l) => {
    const cid = String(l.concept_id || 'null');

    if (l.line_type === 'regular') {
      const extras = extrasMap[cid] || { ot50: 0, ot100: 0 };
      const holidayHours = holidayHoursMap[cid] || 0;
      const toSubtract = extras.ot50 + extras.ot100 + holidayHours;
      if (toSubtract > 0) {
        const newQty = Math.max(0, Number(l.quantity || 0) - toSubtract);
        // Si todas sus horas eran de feriado, la línea quedaría en 0 hs: no tiene sentido mostrarla.
        if (newQty === 0 && holidayHours > 0) return;
        result.push({ ...l, quantity: newQty, subtotal: newQty * Number(l.rate || 0) });
        return;
      }
    } else if (l.line_type === 'extras_50') {
      const fullRate = Number(l.rate || 0) * 2 * 1.5;
      const qty = Number(l.quantity || 0);
      result.push({ ...l, label: l.label.replace('Recargo 50%', 'Horas Extra 50%'), rate: fullRate, subtotal: qty * fullRate });
      return;
    } else if (l.line_type === 'extras_100') {
      const fullRate = Number(l.rate || 0) * 2.0;
      const qty = Number(l.quantity || 0);
      result.push({ ...l, label: l.label.replace('Recargo 100%', 'Horas Extra 100%'), rate: fullRate, subtotal: qty * fullRate });
      return;
    } else if (isWorkedHolidayLine(l)) {
      const concept = l.label.replace(/^Feriado T\s*/, '').trim();
      const fullRate = Number(l.rate || 0) * 2;
      const qty = Number(l.quantity || 0);
      result.push({
        ...l,
        label: concept ? `Feriado trabajado al 100% — ${concept}` : 'Feriado trabajado al 100%',
        rate: fullRate,
        subtotal: qty * fullRate,
        holidayDetail: details.worked,
      });
      return;
    } else if (isNonWorkedHolidayLine(l)) {
      result.push({ ...l, label: 'Feriado no trabajado (pago)', holidayDetail: details.nonWorked });
      return;
    }

    result.push(l);
  });

  return result;
}
