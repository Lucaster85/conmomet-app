import type { BillingStatus, BudgetCurrency, Invoice, InvoiceStatus, VoucherType } from './api';

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

// "A 0001-00001234", o "Sin factura" para un cobro sin comprobante fiscal.
export const formatVoucher = (invoice: Pick<Invoice, 'voucher_type' | 'pos_number' | 'number'>): string => {
  if (invoice.voucher_type === 'sin_factura') return 'Sin factura';
  const pos = String(invoice.pos_number ?? 0).padStart(4, '0');
  const number = String(invoice.number ?? 0).padStart(8, '0');
  return `${invoice.voucher_type} ${pos}-${number}`;
};

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
