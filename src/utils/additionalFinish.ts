import type { Additional } from './api';

// "Notificar finalización" (FLOWS.md §50). Se puede usar mientras el adicional no esté cancelado y
// su presupuesto vigente siga en borrador: con el presupuesto ya enviado no hay nada que cerrar.
// Sobre uno ya Completado también vale — es la forma de cambiar los responsables.
export function canNotifyFinish(additional: Pick<Additional, 'status' | 'current_budget'>): boolean {
  return additional.status !== 'cancelled' && additional.current_budget?.status === 'draft';
}

// "Nombre Apellido, Nombre Apellido" de los responsables de cerrar el presupuesto.
export function assigneesLabel(additional: Pick<Additional, 'budgetAssignees'>): string {
  return (additional.budgetAssignees || []).map((u) => `${u.name} ${u.lastname}`).join(', ');
}
