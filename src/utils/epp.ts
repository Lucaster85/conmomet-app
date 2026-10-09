// Labels y colores compartidos del módulo de EPP. Antes vivían duplicados (y divergentes) entre
// dashboard/safety-equipment/page.tsx y portal/safety-equipment/page.tsx.
import { EppCategory, EppSizeType, SafetyEquipmentComputedStatus } from './api';

export const CATEGORY_LABELS: Record<EppCategory, string> = {
  footwear: 'Calzado',
  clothing: 'Indumentaria',
  head_protection: 'Protección Cabeza',
  hand_protection: 'Protección Manos',
  eye_protection: 'Protección Ocular',
  other: 'Otros',
};

export const SIZE_TYPE_LABELS: Record<EppSizeType, string> = {
  none: 'Sin talle',
  numeric: 'Numérico',
  alpha: 'Alfabético',
};

export const CONDITION_COLORS: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  new: 'success',
  good: 'info',
  worn: 'warning',
  damaged: 'error',
};

export const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuevo',
  good: 'Buen estado',
  worn: 'Desgastado',
  damaged: 'Dañado',
};

export const EPP_STATUS_CONFIG: Record<SafetyEquipmentComputedStatus, { label: string; color: 'default' | 'success' | 'warning' | 'error' }> = {
  permanent: { label: 'Sin vencimiento', color: 'default' },
  valid: { label: 'Vigente', color: 'success' },
  expiring_soon: { label: 'Por vencer', color: 'warning' },
  expired: { label: 'Vencido', color: 'error' },
  renewed: { label: 'Renovada', color: 'default' },
};

// Misma escalera de días que utils/quoteRequestDue.ts, aplicada al vencimiento de una entrega.
export function daysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(expirationDate + 'T00:00:00');
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function eppExpirationLabel(expirationDate: string): string {
  const days = daysUntilExpiration(expirationDate);
  if (days < 0) return `Venció hace ${Math.abs(days)} día${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Vence hoy';
  return `Vence en ${days} día${days === 1 ? '' : 's'}`;
}
