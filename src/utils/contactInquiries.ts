import type { ContactInquiryReason, ContactInquiryStatus } from './api';

// Vocabulario de las consultas web (ver FLOWS.md §58). Espejo de api_conmomet/controllers/
// contactController.js#REASONS y del ENUM de ContactInquiries — si se suma un motivo, va en los tres.
export const CONTACT_REASON_LABELS: Record<ContactInquiryReason, string> = {
  budget_request: 'Pedido de presupuesto',
  general: 'Consulta general',
  supplier: 'Proveedores',
  other: 'Otro',
};

export const CONTACT_REASON_OPTIONS = (Object.keys(CONTACT_REASON_LABELS) as ContactInquiryReason[]).map((value) => ({
  value,
  label: CONTACT_REASON_LABELS[value],
}));

export const CONTACT_STATUS_LABELS: Record<ContactInquiryStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' }> = {
  new: { label: 'Nueva', color: 'warning' },
  in_progress: { label: 'En curso', color: 'info' },
  closed: { label: 'Cerrada', color: 'default' },
};
