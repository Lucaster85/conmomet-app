import type { BillingStatus, BudgetCurrency, Invoice, InvoiceArcaStatus, InvoiceStatus, VoucherType } from './api';

// Utilidades de Facturación compartidas por el listado, el detalle por presupuesto y el diálogo
// de factura. Los importes son siempre netos (sin IVA) salvo donde se aclara.

export const formatMoney = (value: number | string | null | undefined, currency: BudgetCurrency): string => {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol}${(Number(value) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatPercent = (value: number | null | undefined): string =>
  `${(Number(value) || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;

export const formatHours = (value: number | null | undefined): string =>
  `${(Number(value) || 0).toLocaleString('es-AR', { maximumFractionDigits: 1 })} hs`;

export const roundMoney = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
export const roundPercent = (n: number): number => Math.round((n + Number.EPSILON) * 10000) / 10000;

export const ivaOf = (net: number, rate: number): number => roundMoney((net * rate) / 100);

export const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  // Las fechas DATEONLY llegan como "YYYY-MM-DD": se arman a mano para que la zona horaria no corra el día.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const date = new Date(value);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-AR');
};

export const todayISO = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const VOUCHER_TYPE_OPTIONS: { value: VoucherType; label: string }[] = [
  { value: 'A', label: 'Factura A' },
  { value: 'B', label: 'Factura B' },
  { value: 'C', label: 'Factura C' },
  { value: 'E', label: 'Factura E' },
  { value: 'sin_factura', label: 'Sin factura (cobro sin comprobante)' },
];

// Códigos de comprobante de ARCA que se pueden cargar a mano, por letra. ARCA numera por punto de venta Y tipo de
// comprobante, así que una Factura A y una FCE A pueden tener el mismo número (por eso se elige cuál es).
export const CBTE_OPTIONS_BY_LETTER: Record<'A' | 'B' | 'C' | 'E', { value: number; label: string }[]> = {
  A: [
    { value: 1, label: 'Factura' },
    { value: 201, label: 'Factura de Crédito Electrónica (FCE)' },
    { value: 2, label: 'Nota de Débito' },
    { value: 3, label: 'Nota de Crédito' },
    { value: 202, label: 'Nota de Débito FCE' },
    { value: 203, label: 'Nota de Crédito FCE' },
  ],
  B: [{ value: 6, label: 'Factura' }, { value: 7, label: 'Nota de Débito' }, { value: 8, label: 'Nota de Crédito' }],
  C: [{ value: 11, label: 'Factura' }, { value: 12, label: 'Nota de Débito' }, { value: 13, label: 'Nota de Crédito' }],
  E: [{ value: 19, label: 'Factura' }, { value: 20, label: 'Nota de Débito' }, { value: 21, label: 'Nota de Crédito' }],
};
export const DEFAULT_CBTE_BY_LETTER = { A: 1, B: 6, C: 11, E: 19 } as const;

const CBTE_NAMES: Record<number, string> = {
  1: 'Factura A', 2: 'Nota de Débito A', 3: 'Nota de Crédito A', 6: 'Factura B', 7: 'Nota de Débito B', 8: 'Nota de Crédito B',
  11: 'Factura C', 12: 'Nota de Débito C', 13: 'Nota de Crédito C', 19: 'Factura E', 20: 'Nota de Débito E', 21: 'Nota de Crédito E',
  201: 'FCE A', 202: 'ND FCE A', 203: 'NC FCE A',
};

// "Factura A 0001-00001234", o "Sin factura" para un cobro sin comprobante fiscal. Un borrador de ARCA todavía no tiene número.
export const formatVoucher = (invoice: Pick<Invoice, 'voucher_type' | 'pos_number' | 'number'> & { cbte_tipo?: number | null }): string => {
  if (invoice.voucher_type === 'sin_factura') return 'Sin factura';
  const name = (invoice.cbte_tipo && CBTE_NAMES[invoice.cbte_tipo]) || `Factura ${invoice.voucher_type}`;
  const pos = String(invoice.pos_number ?? 0).padStart(4, '0');
  if (!invoice.number) return `${name} ${pos}-sin número`;
  return `${name} ${pos}-${String(invoice.number).padStart(8, '0')}`;
};

// Estado de la emisión por ARCA (las facturas cargadas a mano no tienen: 'manual').
export const ARCA_STATUS_LABELS: Record<Exclude<InvoiceArcaStatus, 'manual'>, { label: string; color: 'default' | 'warning' | 'info' | 'success' | 'error' }> = {
  draft: { label: 'Borrador', color: 'default' },
  authorizing: { label: 'Autorizando…', color: 'warning' },
  authorized: { label: 'Emitida en ARCA', color: 'success' },
  rejected: { label: 'Rechazada por ARCA', color: 'error' },
};

// Factura de Crédito Electrónica MiPyMEs (código 201): opción de transferencia y aceptación del cliente.
export const FCE_CBTE_TIPO = 201;
export const FCE_TRANSFER_LABELS = { SCA: 'SCA — Sistema de circulación abierta', ADC: 'ADC — Agente de depósito colectivo' } as const;
export const FCE_ACCEPTANCE_LABELS = {
  pending: { label: 'Aceptación pendiente', color: 'warning' },
  accepted: { label: 'Aceptada por el cliente', color: 'success' },
  rejected: { label: 'Rechazada por el cliente', color: 'error' },
} as const;

export const ARCA_CONCEPT_LABELS = { 1: 'Productos', 2: 'Servicios', 3: 'Productos y servicios' } as const;

export const BILLING_STATUS_LABELS: Record<BillingStatus, { label: string; color: 'default' | 'warning' | 'info' | 'success' }> = {
  unbilled: { label: 'Sin facturar', color: 'default' },
  partial: { label: 'Facturado parcial', color: 'warning' },
  billed: { label: 'Facturado', color: 'info' },
  billed_and_paid: { label: 'Facturado y cobrado', color: 'success' },
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, { label: string; color: 'warning' | 'success' | 'default' }> = {
  pending: { label: 'Pendiente de cobro', color: 'warning' },
  paid: { label: 'Cobrada', color: 'success' },
  cancelled: { label: 'Anulada', color: 'default' },
};

export const CONCEPT_LABELS = { materials: 'Materiales', labor: 'Mano de obra', other: 'Otro' } as const;

// Alícuotas de IVA configuradas (Configuración General). El 21% es el valor por defecto si está en
// la lista; si no, la primera.
export const ivaInfoFromRates = (rates?: number[] | null): { rates: number[]; default_rate: number } => {
  const list = rates && rates.length > 0 ? [...rates].sort((a, b) => a - b) : [21];
  return { rates: list, default_rate: list.includes(21) ? 21 : list[0] };
};
