import type { BillingStatus, BudgetCurrency, FceAccountState, FceCmpState, FceGroup, Invoice, InvoiceArcaStatus, InvoiceStatus, VoucherType } from './api';

// Utilidades de Facturación compartidas por el listado, el detalle por presupuesto y el diálogo
// de factura. Los importes son siempre netos (sin IVA) salvo donde se aclara.

export const formatMoney = (value: number | string | null | undefined, currency: BudgetCurrency): string => {
  const symbol = currency === 'USD' ? 'US$' : '$';
  return `${symbol}${(Number(value) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Cómo se nombra un presupuesto en el texto de una factura (FLOWS.md §79): por el N° con el que lo identifica el CLIENTE (el que citan
// sus OC), no por el nuestro. Es el mismo texto que arma el servidor (api_conmomet/helpers/budgetClientReference.js): si cambia uno, cambia el otro.
export const NO_CLIENT_BUDGET_NUMBER = 'Sin N° de pres. cliente';
export const clientBudgetReference = (budget: { client_budget_number?: string | null } | null | undefined): string => {
  const number = budget?.client_budget_number?.trim();
  return number ? `Pres. cliente ${number}` : NO_CLIENT_BUDGET_NUMBER;
};

export const formatPercent = (value: number | null | undefined): string =>
  `${(Number(value) || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;

export const formatHours = (value: number | null | undefined): string =>
  `${(Number(value) || 0).toLocaleString('es-AR', { maximumFractionDigits: 1 })} hs`;

export const roundMoney = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
// Cotización del dólar: nunca más de 2 decimales, ni al mostrarla ni al cargarla (ARCA la publica con más, acá se redondea a centavos).
export const roundRate = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;
export const formatRate = (n: number | string | null | undefined): string =>
  (Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// Para el campo de texto: "1497.53" -> "1497,53".
export const rateToInput = (n: number | string | null | undefined): string => roundRate(Number(n) || 0).toFixed(2).replace('.', ',');
// Para el campo de texto: un solo formato, con COMA decimal ("1200,00"), como se muestra en toda la app. Deja solo dígitos y una coma con a lo sumo 2 decimales; un
// punto (el del teclado numérico, o un valor pegado como "1200.00") se convierte en coma, así nunca conviven "1200.00" y "1200,00".
export const sanitizeRateInput = (text: string): string => {
  const clean = text.replace(/\./g, ',').replace(/[^\d,]/g, '');
  const at = clean.indexOf(',');
  if (at < 0) return clean;
  return `${clean.slice(0, at)},${clean.slice(at + 1).replace(/,/g, '').slice(0, 2)}`;
};
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
// Las notas de crédito y de débito ya no se cargan a mano: se hacen desde la factura emitida en la app (necesitan la factura original asociada).
export const CBTE_OPTIONS_BY_LETTER: Record<'A' | 'B' | 'C' | 'E', { value: number; label: string }[]> = {
  A: [
    { value: 1, label: 'Factura' },
    { value: 201, label: 'Factura de Crédito Electrónica (FCE)' },
  ],
  B: [{ value: 6, label: 'Factura' }],
  C: [{ value: 11, label: 'Factura' }],
  E: [{ value: 19, label: 'Factura' }],
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

// Nombre largo de un tipo de comprobante de ARCA, para diálogos y avisos.
const CBTE_LONG_NAMES: Record<number, string> = {
  1: 'Factura A', 2: 'Nota de Débito A', 3: 'Nota de Crédito A',
  201: 'Factura de Crédito Electrónica (FCE) A', 202: 'Nota de Débito de FCE A', 203: 'Nota de Crédito de FCE A',
};
export const cbteLongName = (cbteTipo?: number | null): string => (cbteTipo && CBTE_LONG_NAMES[cbteTipo]) || 'Comprobante';

// ¿Es una nota (de crédito o de débito) y no una factura? Las facturas viejas no traen `kind`.
export const isNote = (invoice: Pick<Invoice, 'kind'>): boolean => !!invoice.kind && invoice.kind !== 'invoice';

export const NOTE_KIND_LABELS = { credit_note: 'Nota de crédito', debit_note: 'Nota de débito' } as const;

// "Factura A 0003-00000001" de la factura a la que está asociada una nota.
export const formatAssociated = (invoice: Pick<Invoice, 'associatedInvoice'>): string =>
  invoice.associatedInvoice ? formatVoucher({ ...invoice.associatedInvoice }) : '';

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
type ChipColor = 'default' | 'warning' | 'info' | 'success' | 'error';

// Seguimiento con ARCA (wsfecred, FLOWS.md §77): los estados tal cual los da ARCA, en lenguaje llano.
export const FCE_CMP_STATE_LABELS: Record<FceCmpState, { label: string; color: ChipColor }> = {
  PendienteRecepcion: { label: 'Pendiente de recepción', color: 'default' },
  Recepcionado: { label: 'Recepcionada', color: 'info' },
  Aceptado: { label: 'Aceptada', color: 'success' },
  Rechazado: { label: 'Rechazada', color: 'error' },
  InformadaAgDpto: { label: 'Informada al ADC', color: 'success' },
};
export const FCE_ACCOUNT_STATE_LABELS: Record<FceAccountState, { label: string; color: ChipColor }> = {
  Modificable: { label: 'Modificable', color: 'default' },
  Aceptada: { label: 'Aceptada', color: 'success' },
  Rechazada: { label: 'Rechazada', color: 'error' },
  CanceladaTotal: { label: 'Cancelada totalmente', color: 'default' },
  InformadaAgDpto: { label: 'Informada al ADC', color: 'success' },
};
export const FCE_GROUP_LABELS: Record<FceGroup, { label: string; color: ChipColor }> = {
  pending: { label: 'Pendientes', color: 'warning' },
  accepted: { label: 'Aceptadas', color: 'success' },
  rejected: { label: 'Rechazadas', color: 'error' },
  informed: { label: 'Informadas al ADC', color: 'info' },
  cancelled: { label: 'Canceladas', color: 'default' },
};

type FceStateFields = Pick<Invoice, 'fce_cmp_state' | 'fce_account_state' | 'fce_acceptance_type' | 'fce_synced_at'>;

// Mismo criterio que el servidor (services/arca/fceSync.js#stateGroup).
export const fceGroup = (inv: Pick<Invoice, 'fce_cmp_state' | 'fce_account_state'>): FceGroup => {
  const cmp = inv.fce_cmp_state;
  const account = inv.fce_account_state;
  if (account === 'CanceladaTotal') return 'cancelled';
  if (account === 'InformadaAgDpto' || cmp === 'InformadaAgDpto') return 'informed';
  if (account === 'Rechazada' || cmp === 'Rechazado') return 'rejected';
  if (account === 'Aceptada' || cmp === 'Aceptado') return 'accepted';
  return 'pending';
};

// Chip con el estado de la FCE según ARCA. Sin sincronizar nunca no hay dato: se dice, no se inventa.
export const fceStateChip = (inv: FceStateFields): { label: string; color: ChipColor } => {
  if (!inv.fce_synced_at) return { label: 'Sin datos de ARCA', color: 'default' };
  switch (fceGroup(inv)) {
    case 'rejected': return { label: 'Rechazada por el cliente', color: 'error' };
    case 'accepted': return { label: inv.fce_acceptance_type === 'Tacita' ? 'Aceptada tácitamente' : 'Aceptada por el cliente', color: 'success' };
    case 'informed': return { label: 'Informada al ADC', color: 'info' };
    case 'cancelled': return { label: 'Cancelada totalmente', color: 'default' };
    default: return inv.fce_cmp_state === 'Recepcionado' ? { label: 'Recepcionada, a la espera del cliente', color: 'warning' } : { label: 'Pendiente de recepción', color: 'warning' };
  }
};

// "Vence la aceptación en 3 días" / "hoy" / "venció hace 2 días". null si no hay fecha.
export const acceptanceDueText = (daysLeft: number | null | undefined): string | null => {
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft === 0) return 'La aceptación vence hoy';
  if (daysLeft === 1) return 'La aceptación vence mañana';
  if (daysLeft > 1) return `La aceptación vence en ${daysLeft} días`;
  return `El plazo de aceptación venció hace ${-daysLeft} ${daysLeft === -1 ? 'día' : 'días'}`;
};

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

export const CONCEPT_LABELS = { materials: 'Materiales', labor: 'Mano de obra', other: 'Otro', adjustment: 'Ajuste', oca: 'OCA' } as const;
export const ADJUSTMENT_TYPE_LABELS = { ipc_indec: 'IPC (INDEC)', uocra: 'UOCRA', other: 'Otro índice' } as const;

// Alícuotas de IVA configuradas (Configuración General). El 21% es el valor por defecto si está en
// la lista; si no, la primera.
export const ivaInfoFromRates = (rates?: number[] | null): { rates: number[]; default_rate: number } => {
  const list = rates && rates.length > 0 ? [...rates].sort((a, b) => a - b) : [21];
  return { rates: list, default_rate: list.includes(21) ? 21 : list[0] };
};

// OC del cliente, cauciones y documentos extra (FLOWS.md §69).
export const PO_CONCEPT_LABELS = { materials: 'Materiales', labor: 'Mano de obra', all: 'Materiales y mano de obra' } as const;
export const PO_ADJUSTMENT_LABELS = { ipc_indec: 'IPC (INDEC)', uocra: 'UOCRA', other: 'Otro índice' } as const;
export const PO_STATUS_LABELS = {
  active: { label: 'Vigente', color: 'success' },
  rejected: { label: 'Rechazada', color: 'error' },
  replaced: { label: 'Reemplazada', color: 'default' },
} as const;
export const BOND_PURPOSE_LABELS = { advance_payment: 'Anticipo', other: 'Otro' } as const;
export const BOND_STATUS_LABELS = {
  released: { label: 'Liberada', color: 'default' },
  no_expiration: { label: 'Sin vencimiento', color: 'default' },
  expired: { label: 'Vencida', color: 'error' },
  expiring_soon: { label: 'Por vencer', color: 'warning' },
  active: { label: 'Vigente', color: 'success' },
} as const;
export const BILLING_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
export const BILLING_FILE_MAX_BYTES = 20 * 1024 * 1024;
export const BILLING_FILE_MAX_COUNT = 10;

/** Valida los archivos elegidos antes de subirlos (el backend vuelve a validar). Devuelve el mensaje de error o ''. */
export const validateBillingFiles = (files: File[]): string => {
  if (files.length > BILLING_FILE_MAX_COUNT) return `Podés adjuntar hasta ${BILLING_FILE_MAX_COUNT} archivos.`;
  const tooBig = files.find((f) => f.size > BILLING_FILE_MAX_BYTES);
  return tooBig ? `"${tooBig.name}" pesa más de 20 MB.` : '';
};

/** "3 días" / "mañana" / "vence hoy" / "vencida hace 2 días" para una caución. */
export const bondDaysLabel = (daysLeft: number | null): string => {
  if (daysLeft === null) return 'sin vencimiento';
  if (daysLeft < 0) return `vencida hace ${-daysLeft} ${daysLeft === -1 ? 'día' : 'días'}`;
  if (daysLeft === 0) return 'vence hoy';
  if (daysLeft === 1) return 'vence mañana';
  return `vence en ${daysLeft} días`;
};

// Avance real de obra (FLOWS.md §72).
export const PROGRESS_SOURCE_LABELS = { manual: 'Cargado a mano', certificate: 'Certificado' } as const;
export const PROGRESS_STATUS_LABELS = {
  presented: { label: 'Presentado', color: 'warning' },
  approved: { label: 'Aprobado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'error' },
} as const;
