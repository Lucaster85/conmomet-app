import type { LeaveBalance } from './api';

// Leyenda que explica de dónde salen los "días correspondientes" del saldo de vacaciones
// (FLOWS.md §55). `own` = redactada en primera persona, para el portal del empleado.
export function vacationBalanceNote(balance: LeaveBalance, own = false): string {
  const e = balance.entitlement;
  if (e?.is_override) {
    return own ? 'Tus días fueron asignados manualmente.' : 'Días asignados manualmente en el legajo.';
  }
  if (e?.is_proportional) {
    const subject = own ? 'Ingresaste' : 'Ingresó';
    return `Proporcional (Arts. 151 y 153 LCT): ${subject.toLowerCase()} este año y no llega a la mitad de los días hábiles del año `
      + `(${e.worked_days} de ${e.year_workdays}; hacen falta ${e.required_days}), así que corresponde 1 día cada 20 trabajados `
      + `en lugar de los ${e.full_days} días completos.`;
  }
  return own ? 'Los días se calculan según tu antigüedad (Art. 150 LCT).' : 'Calculado según antigüedad (Art. 150 LCT).';
}
