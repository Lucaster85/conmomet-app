import { Project } from './api';

export const BUDGET_STATUS_CHIP: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  draft: { label: 'Borrador', color: 'default' },
  sent: { label: 'Enviado', color: 'info' },
  approved: { label: 'Aprobado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'error' },
};

export const PROJECT_STATUS_LABELS: Record<Project['status'], string> = {
  draft: 'Borrador',
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

// Fecha de hoy como YYYY-MM-DD en hora local, para el default de las fechas de inicio.
export const todayLocal = () => new Date().toLocaleDateString('en-CA');
