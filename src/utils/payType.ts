export type PayType = 'hourly' | 'monthly' | 'biweekly_fixed';

// Mensualizados y quincenales fijos comparten sueldo fijo definido en la tarifa del empleado
// (Employee.monthly_salary) en vez de cobrar por hora trabajada.
export function isFixedSalaryPayType(payType?: string | null): boolean {
  return payType === 'monthly' || payType === 'biweekly_fixed';
}

export function payTypeLabel(payType?: string | null): string {
  if (payType === 'monthly') return 'Mensualizado';
  if (payType === 'biweekly_fixed') return 'Quincenal';
  return 'Jornalizado';
}
