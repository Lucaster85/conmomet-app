'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  InputAdornment, MenuItem, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import ClientBanner from './ClientBanner';
import FeedbackModal from '../FeedbackModal';
import { DeleteOutline as DeleteIcon, UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import CurrencyInput from '../CurrencyInput';
import DateField from '../DateField';
import {
  BillableBudget, BillableOca, BillablePurchaseOrder, BudgetBillingDetail, EditableInvoiceConcept, BudgetCurrency, Invoice, InvoiceArcaOptions, InvoiceClientOption, InvoiceInput,
  InvoiceLineInput, InvoiceProjectOption, InvoiceService, IvaInfo, VoucherType,
} from '../../utils/api';
import {
  ARCA_CONCEPT_LABELS, CBTE_OPTIONS_BY_LETTER, CONCEPT_LABELS, DEFAULT_CBTE_BY_LETTER, FCE_CBTE_TIPO, FCE_TRANSFER_LABELS, formatHours, formatMoney, formatPercent,
  ivaOf, roundMoney, roundPercent, todayISO, VOUCHER_TYPE_OPTIONS, rateToInput, sanitizeRateInput, roundRate} from '../../utils/billing';
import { TAX_CONDITION_LABELS, TaxCondition } from '../../utils/cuit';

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (invoice: Invoice) => void;
  // Detalle de facturación del presupuesto a facturar. Sin él, es una factura libre.
  detail?: BudgetBillingDetail | null;
  // Otros presupuestos del mismo cliente que arrancan incluidos en la factura (FLOWS.md §70). También se pueden sumar desde el diálogo.
  extraDetails?: BudgetBillingDetail[];
  // OCA que arrancan incluidas en la factura y el cliente al que se le factura cuando no hay presupuesto (FLOWS.md §74).
  ocas?: BillableOca[];
  ocaClient?: InvoiceClientOption | null;
  // Si viene, se está CORRIGIENDO esa factura (requiere invoices_correct).
  invoice?: Invoice | null;
  ivaInfo: IvaInfo;
  // invoices_unofficial: habilita la opción "Sin factura".
  canUnofficial: boolean;
}

// Una línea en edición. El usuario carga el porcentaje O el monto y el otro se calcula; `source`
// recuerda cuál de los dos escribió por última vez, que es el que se manda al servidor (que
// recalcula el otro contra la base real del presupuesto).
interface LineState {
  key: string;
  // Presupuesto de la línea (null en la factura libre) y OC contra la que se factura (opcional).
  budgetId: number | null;
  orderId: number | null;
  // Avance real de obra que factura la línea (opcional, FLOWS.md §72).
  progressId?: number | null;
  concept: EditableInvoiceConcept;
  percentText: string;
  amount: number | null;
  description: string;
  source: 'percent' | 'amount';
  // true si la persona escribió la descripción: mientras sea false, la descripción es el texto estándar y se actualiza sola al cambiar el porcentaje, la OC o el presupuesto.
  descriptionTouched?: boolean;
}

const CURRENCIES: BudgetCurrency[] = ['ARS', 'USD'];
const TOLERANCE = 0.01;
let lineCounter = 0;
const newKey = () => `line-${++lineCounter}`;

const parsePercent = (text: string): number => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// Una OCA incluida en la factura: se cobra entera, con el importe que salió de sus horas (no se edita); la descripción sí.
const ocaDefaultDescription = (type: 'man_hours' | 'crane_hours', number: string) => `${type === 'man_hours' ? 'Hora hombre' : 'Servicio de grúa'} OCA ${number}`;

interface OcaItem { id: number; number: string; type: 'man_hours' | 'crane_hours'; netAmount: number; description: string }

export default function InvoiceDialog({ open, onClose, onSaved, detail, extraDetails, ocas, ocaClient, invoice, ivaInfo, canUnofficial }: InvoiceDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = !!invoice;
  const [ocaItems, setOcaItems] = useState<OcaItem[]>([]);
  const [pickableOcas, setPickableOcas] = useState<BillableOca[]>([]);
  // Con OCA (o una factura que ya las cobra) no es una factura libre aunque no haya presupuesto.
  const ocaMode = ocaItems.length > 0 || (ocas?.length ?? 0) > 0 || !!invoice?.lines.some((l) => l.concept === 'oca');
  const isFree = !detail && !ocaMode;
  const contextClient = (detail?.budget.client ?? ocaClient ?? (invoice?.client as { id: number; razonSocial: string } | undefined) ?? null) as { id: number; razonSocial: string; cuit?: string | null; tax_condition?: TaxCondition | null; fce_transfer_option?: 'SCA' | 'ADC' | null } | null;
  // Presupuestos que cobra la factura. El primero es el ancla (de ahí salen el cliente y las opciones de ARCA); el resto se suma desde el diálogo.
  const [blocks, setBlocks] = useState<BudgetBillingDetail[]>([]);
  const [pickable, setPickable] = useState<BillableBudget[]>([]);
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [commercialTouched, setCommercialTouched] = useState(false);
  const ownActive = isEditing && invoice?.status !== 'cancelled';
  const isMulti = blocks.length > 1;

  const [voucherType, setVoucherType] = useState<VoucherType>('A');
  const [posNumber, setPosNumber] = useState('');
  const [number, setNumber] = useState('');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [currency, setCurrency] = useState<BudgetCurrency>('ARS');
  const [exchangeRate, setExchangeRate] = useState('');
  const [ivaRate, setIvaRate] = useState(ivaInfo.default_rate);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [lines, setLines] = useState<LineState[]>([]);
  const [clients, setClients] = useState<InvoiceClientOption[]>([]);
  const [client, setClient] = useState<InvoiceClientOption | null>(null);
  const [projectOptions, setProjectOptions] = useState<InvoiceProjectOption[]>([]);
  const [project, setProject] = useState<InvoiceProjectOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // --- Emisión por ARCA ---
  // mode 'arca': se guarda un BORRADOR que después se emite desde el listado (el número lo asigna ARCA). mode 'manual':
  // la factura que ya se hizo en la web de ARCA y se carga con su número.
  const [arcaOptions, setArcaOptions] = useState<InvoiceArcaOptions | null>(null);
  const [mode, setMode] = useState<'manual' | 'arca'>('manual');
  const [cbteTipo, setCbteTipo] = useState<number>(1);
  const [posId, setPosId] = useState<number | ''>('');
  const [concept, setConcept] = useState<1 | 2 | 3>(2);
  const [conceptTouched, setConceptTouched] = useState(false);
  const [serviceFrom, setServiceFrom] = useState('');
  const [serviceTo, setServiceTo] = useState('');
  const [recipientVatId, setRecipientVatId] = useState<number | ''>('');
  const [sameCurrency, setSameCurrency] = useState(false);
  const [saleCondition, setSaleCondition] = useState('');
  const [remito, setRemito] = useState('');
  const [commercialRef, setCommercialRef] = useState('');
  const [rateLoading, setRateLoading] = useState(false);
  // Tipo que se emite por ARCA: Factura A (1) o Factura de Crédito Electrónica A (201). Lo elige a mano quien factura: no hay regla automática.
  const [arcaCbte, setArcaCbte] = useState<1 | 201>(1);
  const [bankAccountId, setBankAccountId] = useState<number | ''>('');
  const [fceTransfer, setFceTransfer] = useState<'SCA' | 'ADC'>('SCA');
  const isArca = mode === 'arca';
  const isFce = isArca && arcaCbte === FCE_CBTE_TIPO;

  const detailOf = (budgetId: number | null) => blocks.find((b) => b.budget.id === budgetId) || null;
  const billingOf = (budgetId: number | null) => detailOf(budgetId)?.billing;
  const sumOf = (list: { amount: number | null }[]) => roundMoney(list.reduce((acc, l) => acc + (l.amount || 0), 0));

  // Lo que la propia factura ya tenía cargado (al corregir, ese monto vuelve a estar disponible: el servidor lo excluye del cálculo igual).
  const ownLines = (cur: BudgetCurrency) => (ownActive && invoice && invoice.currency === cur ? invoice.lines : []);
  const ownSum = (cur: BudgetCurrency, pick: (l: Invoice['lines'][number]) => boolean) =>
    roundMoney(ownLines(cur).filter(pick).reduce((acc, l) => acc + l.net_amount, 0));

  // OC vigentes de un presupuesto que sirven para facturar un concepto en la moneda elegida.
  const ordersFor = (budgetId: number | null, concept: EditableInvoiceConcept, cur: BudgetCurrency = currency): BillablePurchaseOrder[] =>
    (detailOf(budgetId)?.purchase_orders || [])
      .filter((o) => o.status === 'active' && o.currency === cur && (o.concept === 'all' || o.concept === concept))
      .map((o) => ({ id: o.id, number: o.number, concept: o.concept, currency: o.currency, amount: o.amount, billed: o.billed ?? 0, balance: o.balance ?? null }));

  // Saldo disponible para UNA línea: el del concepto de su presupuesto menos lo que ya piden las otras líneas del mismo concepto y, si tiene OC con
  // monto, también el saldo de la OC. Es el límite que después valida el servidor.
  const availableFor = (line: LineState, cur: BudgetCurrency = currency): number => {
    const billing = billingOf(line.budgetId);
    if (!billing || line.concept === 'other') return 0;
    const concept = line.concept;
    let available = billing.balances[cur][concept]
      + ownSum(cur, (l) => l.budget_id === line.budgetId && l.concept === concept)
      - sumOf(lines.filter((o) => o.key !== line.key && o.budgetId === line.budgetId && o.concept === concept));
    if (line.orderId) {
      const order = ordersFor(line.budgetId, concept, cur).find((o) => o.id === line.orderId);
      if (order && order.balance !== null) {
        const orderAvailable = order.balance
          + ownSum(cur, (l) => l.purchase_order_id === order.id)
          - sumOf(lines.filter((o) => o.key !== line.key && o.orderId === order.id));
        available = Math.min(available, orderAvailable);
      }
    }
    return roundMoney(Math.max(available, 0));
  };

  // Saldo del concepto de un presupuesto, sin mirar OC ni otras líneas (para decidir si tiene algo para ofrecer).
  const budgetBalance = (budgetId: number | null, cur: BudgetCurrency, concept: 'materials' | 'labor'): number => {
    const billing = billingOf(budgetId);
    if (!billing || billing.bases[cur][concept].net <= TOLERANCE) return 0;
    return roundMoney(billing.balances[cur][concept] + ownSum(cur, (l) => l.budget_id === budgetId && l.concept === concept));
  };

  const currencyOptions = useMemo(() => {
    // Las OCA se facturan en pesos.
    if (ocaItems.length > 0) return ['ARS'] as BudgetCurrency[];
    if (blocks.length === 0) return CURRENCIES;
    return CURRENCIES.filter((cur) => blocks.some((b) => (['materials', 'labor'] as const).some((c) => budgetBalance(b.budget.id, cur, c) > TOLERANCE)));
    // budgetBalance depende de blocks, invoice y ownActive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, invoice, ownActive, ocaItems.length]);

  // Carga inicial cada vez que se abre.
  useEffect(() => {
    if (!open) return;
    setError('');
    setFile(null);
    if (invoice) {
      setVoucherType(invoice.voucher_type);
      setPosNumber(invoice.pos_number ? String(invoice.pos_number) : '');
      setNumber(invoice.number ? String(invoice.number) : '');
      setIssueDate(invoice.issue_date);
      setDueDate(invoice.due_date || '');
      setPaidAt(invoice.paid_at || '');
      setCurrency(invoice.currency);
      setExchangeRate(invoice.exchange_rate ? rateToInput(invoice.exchange_rate) : '');
      setIvaRate(invoice.iva_rate);
      setNotes(invoice.notes || '');
      setMode(invoice.source === 'arca' ? 'arca' : 'manual');
      setCbteTipo(invoice.cbte_tipo || DEFAULT_CBTE_BY_LETTER[invoice.voucher_type === 'sin_factura' ? 'A' : invoice.voucher_type]);
      setPosId(invoice.point_of_sale_id || '');
      setConcept((invoice.arca_concept as 1 | 2 | 3) || 2);
      setConceptTouched(true);
      setServiceFrom(invoice.service_from || '');
      setServiceTo(invoice.service_to || '');
      setRecipientVatId(invoice.recipient_vat_condition_id || '');
      setArcaCbte(invoice.cbte_tipo === FCE_CBTE_TIPO ? FCE_CBTE_TIPO : 1);
      setBankAccountId(invoice.bank_account_id || '');
      setFceTransfer(invoice.fce_transfer_option || 'SCA');
      setSameCurrency(!!invoice.same_currency_payment);
      setSaleCondition(invoice.sale_condition || '');
      setRemito(invoice.remito_number || '');
      setCommercialRef(invoice.commercial_reference || '');
      setCommercialTouched(true);
      setOcaItems(invoice.lines.filter((l) => l.concept === 'oca' && l.oca_id).map((l) => ({
        id: l.oca_id as number, number: l.oca?.number || String(l.oca_id), type: l.oca?.type || 'man_hours', netAmount: l.net_amount, description: l.description || ocaDefaultDescription(l.oca?.type || 'man_hours', l.oca?.number || String(l.oca_id)),
      })));
      setLines(invoice.lines.filter((l) => l.concept !== 'oca').map((l) => ({
        key: newKey(),
        budgetId: l.budget_id ?? invoice.budget_id ?? null,
        orderId: l.purchase_order_id ?? null,
        progressId: l.progress_entry_id ?? null,
        concept: l.concept as EditableInvoiceConcept,
        percentText: l.percent != null ? String(l.percent) : '',
        amount: l.net_amount,
        description: l.description || '',
        // Lo guardado cuenta como escrito a mano; si coincide con el texto estándar, se vuelve automático (ver el chequeo de abajo).
        descriptionTouched: !!l.description,
        source: 'amount',
      })));
    } else {
      setVoucherType('A');
      setPosNumber('');
      setNumber('');
      setIssueDate(todayISO());
      setDueDate('');
      setPaidAt('');
      setExchangeRate('');
      setIvaRate(ivaInfo.default_rate);
      setNotes('');
      setMode('manual');
      setCbteTipo(1);
      setPosId('');
      setConcept(2);
      setConceptTouched(false);
      setServiceFrom('');
      setServiceTo('');
      setRecipientVatId('');
      setArcaCbte(1);
      setBankAccountId('');
      setFceTransfer('SCA');
      setSameCurrency(false);
      setSaleCondition('');
      setRemito('');
      setCommercialRef('');
      setCommercialTouched(false);
      setOcaItems((ocas || []).map((o) => ({ id: o.id, number: o.number, type: o.type, netAmount: o.net_amount, description: ocaDefaultDescription(o.type, o.number) })));
      setLines(detail || (ocas || []).length > 0 ? [] : [{ key: newKey(), budgetId: null, orderId: null, concept: 'other', percentText: '', amount: null, description: '', source: 'amount' }]);
      if ((ocas || []).length > 0) setCurrency('ARS');
    }
    setClient(null);
    setProject(null);
    // Solo al abrir: no queremos pisar lo que el usuario esté escribiendo si cambia el padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice, detail?.budget.id]);

  // Presupuestos de la factura: el ancla, los que vienen de afuera y, al corregir, los demás presupuestos de la factura (se piden al abrir).
  useEffect(() => {
    if (!open || !detail) { setBlocks([]); setPickable([]); return; }
    let cancelled = false;
    const initial = [detail, ...(extraDetails || []).filter((d) => d.budget.id !== detail.budget.id)];
    setBlocks(initial);
    const missing = invoice
      ? [...new Set(invoice.lines.map((l) => l.budget_id).filter((id): id is number => !!id))].filter((id) => !initial.some((d) => d.budget.id === id))
      : [];
    Promise.all(missing.map((id) => InvoiceService.getBillable(id)))
      .then((loaded) => { if (!cancelled && loaded.length > 0) setBlocks([...initial, ...loaded]); })
      .catch(() => { if (!cancelled) setError('No se pudieron cargar todos los presupuestos de la factura.'); });
    // Con la lista de los presupuestos del cliente se arma el "Agregar otro presupuesto".
    InvoiceService.getBillables({ client_id: detail.budget.client?.id }).then((res) => { if (!cancelled) setPickable(res.data); }).catch(() => { if (!cancelled) setPickable([]); });
    return () => { cancelled = true; };
    // Solo al abrir (o al cambiar de factura).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice, detail?.budget.id]);

  // Moneda inicial de una factura nueva: la primera que todavía tenga saldo en alguno de los presupuestos.
  useEffect(() => {
    if (!open || invoice || blocks.length === 0) return;
    setCurrency((current) => (currencyOptions.includes(current) ? current : currencyOptions[0] || current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, blocks]);

  // Opciones de ARCA: solo para facturas de un presupuesto (la factura libre se sigue cargando a mano). Si la integración
  // está prendida y hay puntos de venta de web service, una factura nueva arranca como "Emitir por ARCA".
  useEffect(() => {
    if (!open || (!detail && !ocaMode)) { setArcaOptions(null); return; }
    let cancelled = false;
    InvoiceService.getArcaOptions().then((opts) => {
      if (cancelled) return;
      setArcaOptions(opts);
      if (!invoice && opts.enabled && opts.points_of_sale.length > 0) {
        setMode('arca');
        const def = opts.points_of_sale.find((p) => p.is_default) || opts.points_of_sale[0];
        setPosId(def.id);
      }
      const client = contextClient;
      const mapped = client?.tax_condition ? opts.client_tax_condition_map[client.tax_condition] : undefined;
      if (!invoice && mapped) setRecipientVatId(mapped);
      // Opción de transferencia de la FCE: la del cliente (Bunge pide ADC) o, si no tiene, la de la empresa.
      if (!invoice) setFceTransfer(client?.fce_transfer_option || opts.company_fce_transfer_option || 'SCA');
    }).catch(() => { if (!cancelled) setArcaOptions(null); });
    return () => { cancelled = true; };
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detail?.budget.id, ocaClient?.id, invoice]);

  // OCA del cliente que todavía se pueden sumar a la factura (aprobadas, con precio y sin facturar).
  useEffect(() => {
    if (!open || !contextClient) { setPickableOcas([]); return; }
    let cancelled = false;
    InvoiceService.getBillableOcas(contextClient.id).then((list) => { if (!cancelled) setPickableOcas(list.filter((o) => o.billable)); }).catch(() => { if (!cancelled) setPickableOcas([]); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contextClient?.id]);

  // FCE: cuenta bancaria sugerida = la predeterminada que sirva para la moneda de la factura (una cuenta sin moneda sirve para cualquiera).
  // Solo en un borrador nuevo; al editar se respeta la que tenía.
  useEffect(() => {
    if (!isFce || invoice || !arcaOptions) return;
    const usable = arcaOptions.bank_accounts.filter((a) => !a.currency || a.currency === currency);
    setBankAccountId((current) => (usable.some((a) => a.id === current) ? current : (usable[0]?.id ?? '')));
  }, [isFce, invoice, arcaOptions, currency]);

  // Concepto sugerido según lo que se factura (solo materiales = productos, solo mano de obra = servicios, los dos = ambos),
  // mientras la persona no lo haya tocado.
  useEffect(() => {
    if (!isArca || conceptTouched) return;
    const hasMaterials = lines.some((l) => l.concept === 'materials');
    const hasLabor = lines.some((l) => l.concept === 'labor');
    if (hasMaterials && hasLabor) setConcept(3);
    else if (hasMaterials) setConcept(1);
    else if (hasLabor) setConcept(2);
  }, [isArca, conceptTouched, lines]);

  // Referencia comercial: se precarga con los números de las OC de las líneas (Bunge exige el de la OC en la FCE), mientras nadie la toque.
  useEffect(() => {
    if (!isArca || commercialTouched || invoice) return;
    const numbers = [...new Set(lines.map((l) => (l.orderId ? ordersFor(l.budgetId, l.concept).find((o) => o.id === l.orderId)?.number : null)).filter((n): n is string => !!n))];
    setCommercialRef(numbers.join(', '));
    // ordersFor depende de blocks y de la moneda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArca, commercialTouched, invoice, lines, blocks, currency]);

  // En dólares, la cotización se precarga con la de ARCA (la que usa la web de ARCA), editable.
  const loadArcaRate = async () => {
    setRateLoading(true);
    setError('');
    try {
      const quote = await InvoiceService.getArcaExchangeRate();
      setExchangeRate(rateToInput(quote.rate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo traer la cotización de ARCA');
    } finally {
      setRateLoading(false);
    }
  };
  useEffect(() => {
    if (open && isArca && currency === 'USD' && !exchangeRate && !invoice) loadArcaRate();
    // Solo cuando cambia la moneda o el modo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isArca, currency]);

  // Factura libre: clientes y proyectos del cliente elegido.
  useEffect(() => {
    if (!open || !isFree) return;
    InvoiceService.getClientOptions().then((list) => {
      // Una factura nueva solo se le hace a un cliente activo; al corregir se conserva el que tenía.
      setClients(list.filter((c) => c.is_active || c.id === invoice?.client_id));
      if (invoice) setClient(list.find((c) => c.id === invoice.client_id) || null);
    }).catch(() => setClients([]));
  }, [open, isFree, invoice]);

  useEffect(() => {
    if (!open || !isFree || !client) { setProjectOptions([]); return; }
    InvoiceService.getProjectOptions(client.id).then((list) => {
      setProjectOptions(list);
      if (invoice?.project_id) setProject(list.find((p) => p.id === invoice.project_id) || null);
    }).catch(() => setProjectOptions([]));
  }, [open, isFree, client, invoice]);

  const isUnofficial = voucherType === 'sin_factura';
  const voucherOptions = VOUCHER_TYPE_OPTIONS.filter((o) => o.value !== 'sin_factura' || canUnofficial || invoice?.voucher_type === 'sin_factura');
  const rateOptions = ivaInfo.rates.includes(ivaRate) ? ivaInfo.rates : [...ivaInfo.rates, ivaRate].sort((a, b) => a - b);
  const effectiveIvaRate = isUnofficial ? 0 : ivaRate;

  const net = roundMoney(lines.reduce((acc, l) => acc + (l.amount || 0), 0) + ocaItems.reduce((acc, o) => acc + o.netAmount, 0));
  const iva = ivaOf(net, effectiveIvaRate);
  const total = roundMoney(net + iva);

  const baseFor = (line: LineState) => {
    const billing = billingOf(line.budgetId);
    return billing && line.concept !== 'other' ? billing.bases[currency][line.concept] : null;
  };

  const updateLine = (key: string, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handlePercent = (line: LineState, text: string) => {
    const base = baseFor(line);
    const pct = parsePercent(text);
    updateLine(line.key, {
      percentText: text,
      source: 'percent',
      amount: base && pct > 0 ? roundMoney((base.net * pct) / 100) : null,
    });
  };

  const handleAmount = (line: LineState, value: number | null) => {
    // Un "cambio" que deja el mismo monto (el eco de haberlo calculado desde el porcentaje) no se procesa: pisaría el porcentaje que se está escribiendo.
    if ((value ?? null) === (line.amount ?? null)) return;
    const base = baseFor(line);
    updateLine(line.key, {
      amount: value,
      source: 'amount',
      percentText: base && value ? String(roundPercent((value / base.net) * 100)) : '',
    });
  };

  // OC por defecto para una línea nueva: la primera vigente que sirva y que todavía no esté usada en ese concepto del presupuesto.
  const defaultOrderFor = (budgetId: number, concept: 'materials' | 'labor', current: LineState[]): number | null => {
    const usable = ordersFor(budgetId, concept);
    const free = usable.find((o) => !current.some((l) => l.budgetId === budgetId && l.concept === concept && l.orderId === o.id));
    return free ? free.id : null;
  };

  const addConceptLine = (budgetId: number, concept: 'materials' | 'labor') =>
    setLines((prev) => {
      const orderId = defaultOrderFor(budgetId, concept, prev);
      // Sin OC libre, solo se admite una línea "sin OC" por concepto.
      if (orderId === null && prev.some((l) => l.budgetId === budgetId && l.concept === concept && l.orderId === null)) return prev;
      return [...prev, { key: newKey(), budgetId, orderId, concept, percentText: '', amount: null, description: '', source: 'amount' }];
    });

  // "Facturar todo el saldo" de un presupuesto: cada concepto con saldo en esta moneda, al 100% de lo que queda (y contra la OC que lo permita).
  const fillAllBalance = (budgetId: number) => {
    const billing = billingOf(budgetId);
    if (!billing) return;
    const next: LineState[] = lines.filter((l) => l.budgetId !== budgetId);
    (['materials', 'labor'] as const).forEach((concept) => {
      const available = budgetBalance(budgetId, currency, concept);
      const base = billing.bases[currency][concept];
      if (base.net <= TOLERANCE || available <= TOLERANCE) return;
      const order = ordersFor(budgetId, concept).find((o) => o.balance === null || o.balance + ownSum(currency, (l) => l.purchase_order_id === o.id) >= available - TOLERANCE);
      next.push({
        key: newKey(), budgetId, orderId: order ? order.id : null, concept,
        percentText: String(roundPercent((available / base.net) * 100)), amount: available, description: '', source: 'amount',
      });
    });
    setLines(next);
  };

  const addBlock = async (row: BillableBudget | null) => {
    if (!row) return;
    setLoadingBlock(true);
    try {
      const loaded = await InvoiceService.getBillable(row.id);
      setBlocks((prev) => (prev.some((b) => b.budget.id === loaded.budget.id) ? prev : [...prev, loaded]));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el presupuesto');
    } finally {
      setLoadingBlock(false);
    }
  };

  const removeBlock = (budgetId: number) => {
    setBlocks((prev) => prev.filter((b) => b.budget.id !== budgetId));
    setLines((prev) => prev.filter((l) => l.budgetId !== budgetId));
  };

  const handleCurrencyChange = (cur: BudgetCurrency) => {
    if (cur === currency) return;
    setCurrency(cur);
    // Los saldos y las OC son por moneda: las líneas cargadas dejan de tener sentido.
    if (detail || ocaMode) setLines([]);
  };

  const validate = (): string | null => {
    if (!issueDate) return 'La fecha de emisión es obligatoria.';
    if (isArca) {
      if (!posId) return 'Elegí el punto de venta.';
      if (concept !== 1) {
        // El período es opcional: vacío, se usa la fecha de emisión. Si se cargaron los dos, tienen que ser coherentes.
        if (serviceFrom && serviceTo && serviceFrom > serviceTo) return 'El período facturado es inválido: la fecha desde es posterior a la fecha hasta.';
        if (!dueDate) return 'Con servicios hay que indicar el vencimiento de pago.';
      }
      if (currency === 'USD' && !(Number(exchangeRate.replace(',', '.')) > 0)) return 'En dólares hace falta la cotización.';
      if (isFce) {
        if (!bankAccountId) return 'Elegí la cuenta bancaria del emisor (CBU) para la FCE.';
        if (!dueDate) return 'La FCE necesita el vencimiento de pago.';
        if (dueDate < issueDate) return 'El vencimiento de pago no puede ser anterior a la fecha de emisión.';
        if (commercialRef.length > 50) return 'La referencia comercial de una FCE admite hasta 50 caracteres.';
      }
    } else if (!isUnofficial) {
      const pos = Number(posNumber);
      const num = Number(number);
      if (!Number.isInteger(pos) || pos < 1 || pos > 99999) return 'Ingresá el punto de venta (1 a 99999).';
      if (!Number.isInteger(num) || num < 1 || num > 99999999) return 'Ingresá el número de comprobante.';
    }
    if (isFree && !client) return 'Elegí el cliente.';
    if (lines.length === 0 && ocaItems.length === 0) return 'Agregá al menos un concepto a facturar.';
    for (const line of lines) {
      const where = isMulti && line.budgetId ? ` (${detailOf(line.budgetId)?.budget.number})` : '';
      if (!(line.amount && line.amount > 0)) return `Indicá el monto o el porcentaje de ${CONCEPT_LABELS[line.concept].toLowerCase()}${where}.`;
      if (line.concept === 'other' && !line.description.trim()) return 'Cada línea necesita una descripción.';
      if (line.concept !== 'other' && line.amount > availableFor(line) + TOLERANCE) {
        return `El monto de ${CONCEPT_LABELS[line.concept].toLowerCase()}${where} supera el saldo disponible${line.orderId ? ' (o el de la OC elegida)' : ''}.`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    const lineInputs: InvoiceLineInput[] = lines.map((l) => {
      if (l.concept === 'other') return { concept: 'other', description: l.description.trim(), net_amount: l.amount || 0 };
      const target = {
        budget_id: l.budgetId ?? undefined,
        purchase_order_id: l.orderId,
        progress_entry_id: l.progressId ?? null,
        concept: l.concept,
        description: l.description.trim() || undefined,
      };
      return l.source === 'percent' && parsePercent(l.percentText) > 0
        ? { ...target, percent: parsePercent(l.percentText) }
        : { ...target, net_amount: l.amount || 0 };
    });

    // Las OCA van enteras: solo se manda cuál y, si se escribió, la descripción (el importe sale de las horas en el servidor).
    lineInputs.push(...ocaItems.map((o): InvoiceLineInput => ({ oca_id: o.id, ...(o.description.trim() ? { description: o.description.trim() } : {}) })));

    const arcaFields: Partial<InvoiceInput> = isArca ? {
      source: 'arca',
      cbte_tipo: arcaCbte,
      bank_account_id: isFce && bankAccountId !== '' ? Number(bankAccountId) : null,
      fce_transfer_option: isFce ? fceTransfer : null,
      point_of_sale_id: Number(posId),
      arca_concept: concept,
      service_from: concept === 1 ? null : serviceFrom || null,
      service_to: concept === 1 ? null : serviceTo || null,
      recipient_vat_condition_id: recipientVatId === '' ? null : Number(recipientVatId),
      same_currency_payment: currency === 'USD' ? sameCurrency : null,
      sale_condition: saleCondition.trim() || null,
      remito_number: remito.trim() || null,
      commercial_reference: commercialRef.trim() || null,
    } : {};

    const input: InvoiceInput = {
      voucher_type: isArca ? 'A' : voucherType,
      cbte_tipo: isArca ? arcaCbte : isUnofficial ? null : cbteTipo,
      ...arcaFields,
      pos_number: isArca || isUnofficial ? null : Number(posNumber),
      number: isArca || isUnofficial ? null : Number(number),
      issue_date: issueDate,
      due_date: dueDate || null,
      currency,
      exchange_rate: currency === 'USD' && exchangeRate ? roundRate(Number(exchangeRate.replace(',', '.'))) : null,
      iva_rate: effectiveIvaRate,
      // La cabecera solo lleva el presupuesto cuando es uno; con varios, cada línea trae el suyo.
      budget_id: detail && !isMulti ? blocks[0]?.budget.id ?? detail.budget.id : null,
      client_id: isFree ? client?.id : undefined,
      project_id: isFree ? project?.id ?? null : undefined,
      notes: notes.trim() || null,
      paid_at: invoice?.status === 'paid' ? paidAt || null : undefined,
      lines: lineInputs,
      file: isArca ? null : file,
    };

    setSaving(true);
    setError('');
    try {
      const saved = invoice ? await InvoiceService.update(invoice.id, input) : await InvoiceService.create(input);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la factura');
    } finally {
      setSaving(false);
    }
  };

  // Texto con el que sale la línea si no se escribe otro (el mismo que arma el PDF en el servidor).
  const defaultDescription = (line: LineState): string => {
    if (line.concept === 'other') return '';
    const pct = parsePercent(line.percentText);
    const head = pct > 0 ? `Se factura el ${formatPercent(pct)} de ${CONCEPT_LABELS[line.concept].toLowerCase()}` : `Se factura ${CONCEPT_LABELS[line.concept].toLowerCase()}`;
    const budget = detailOf(line.budgetId)?.budget;
    const order = ordersFor(line.budgetId, line.concept).find((o) => o.id === line.orderId);
    const detailText = [order ? `OC ${order.number}` : '', budget ? [budget.number, budget.title].filter(Boolean).join(' ') : ''].filter(Boolean).join(' · ');
    return detailText ? `${head} — ${detailText}` : head;
  };

  const renderBudgetLine = (line: LineState) => {
    if (line.concept === 'other') return null;
    const concept = line.concept;
    const billing = billingOf(line.budgetId);
    if (!billing) return null;
    const base = billing.bases[currency][concept];
    const available = availableFor(line);
    const progress = billing.project_progress;
    const pct = parsePercent(line.percentText);
    const orders = ordersFor(line.budgetId, concept);
    const usedElsewhere = (orderId: number) => lines.some((o) => o.key !== line.key && o.budgetId === line.budgetId && o.concept === concept && o.orderId === orderId);
    return (
      <Box key={line.key} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>{CONCEPT_LABELS[concept]}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Neto {formatMoney(base.net, currency)}
              {base.discount_percent > 0 ? ` (con ${formatPercent(base.discount_percent)} de bonificación)` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Saldo disponible: <strong>{formatMoney(available, currency)}</strong>
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))} aria-label="Quitar concepto">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        {orders.length > 0 && (
          <TextField
            select size="small" fullWidth label="OC del cliente (opcional)" value={line.orderId ?? ''} sx={{ mt: 1.5 }}
            onChange={(e) => updateLine(line.key, { orderId: e.target.value === '' ? null : Number(e.target.value) })}
            helperText="Si la línea se factura contra una OC, también respeta el saldo de la OC y su número sale en la referencia comercial."
          >
            <MenuItem value="">Sin OC</MenuItem>
            {orders.map((o) => (
              <MenuItem key={o.id} value={o.id} disabled={usedElsewhere(o.id)}>
                OC {o.number}{o.balance !== null ? ` · saldo ${formatMoney(o.balance + ownSum(currency, (l) => l.purchase_order_id === o.id), currency)}` : ' · sin monto'}
              </MenuItem>
            ))}
          </TextField>
        )}
        {(detailOf(line.budgetId)?.progress_entries || []).some((p) => p.status !== 'rejected') && (
          <TextField
            select size="small" fullWidth label="Avance real que se factura (opcional)" value={line.progressId ?? ''} sx={{ mt: 1.5 }}
            onChange={(e) => updateLine(line.key, { progressId: e.target.value === '' ? null : Number(e.target.value) })}
            helperText="Deja asociada la factura al avance (por ejemplo, el del certificado). Solo informativo: no cambia el saldo."
          >
            <MenuItem value="">Sin asociar</MenuItem>
            {(detailOf(line.budgetId)?.progress_entries || []).filter((p) => p.status !== 'rejected').map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {formatPercent(p.percent)} · {p.date.split('-').reverse().join('/')}{p.source === 'certificate' ? ` · certificado ${p.certificate_number}${p.status === 'presented' ? ' (presentado)' : ''}` : ''}
              </MenuItem>
            ))}
          </TextField>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
          <TextField
            label="Porcentaje" type="number" value={line.percentText}
            onChange={(e) => handlePercent(line, e.target.value)}
            inputProps={{ min: 0, max: 100, step: 'any', inputMode: 'decimal' }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            sx={{ width: { xs: '100%', sm: 160 } }}
          />
          <CurrencyInput
            label="Monto a facturar (neto)" currency={currency} fullWidth
            value={line.amount} onChange={(v) => handleAmount(line, v)}
          />
        </Stack>
        <TextField
          size="small" fullWidth label="Descripción en la factura" value={line.description} sx={{ mt: 1.5 }}
          onChange={(e) => updateLine(line.key, { description: e.target.value, descriptionTouched: true })}
          inputProps={{ maxLength: 255 }}
          helperText={line.descriptionTouched
            ? 'Texto escrito por vos. Si querés volver al estándar, usá «Restaurar texto estándar».'
            : 'Texto estándar: podés dejarlo así o editarlo (por ejemplo, con la posición de la OC). Si cambiás el porcentaje o la OC, se actualiza solo.'}
        />
        {line.descriptionTouched && (
          <Button size="small" sx={{ mt: 0.5 }} onClick={() => updateLine(line.key, { description: defaultDescription(line), descriptionTouched: false })}>Restaurar texto estándar</Button>
        )}
        {concept === 'labor' && (
          <Typography variant="caption" color={progress ? 'text.secondary' : 'warning.main'} display="block" sx={{ mt: 1 }}>
            {progress
              ? `${formatPercent(pct)} ≈ ${formatHours((progress.budgeted_hours_own * pct) / 100)} de ${formatHours(progress.budgeted_hours_own)} presupuestadas · avance real ${formatHours(progress.consumed_hours_own)}${progress.progress_percent != null ? ` (${formatPercent(progress.progress_percent)})` : ''}`
              : 'Sin proyecto todavía: no hay avance de horas para comparar.'}
          </Typography>
        )}
      </Box>
    );
  };

  // El texto estándar de cada línea que la persona no tocó se mantiene al día (porcentaje, OC, presupuesto, moneda). Es lo que se ve en el campo y lo que se guarda.
  const descriptionsKey = lines.map((l) => `${l.key}|${l.percentText}|${l.orderId}|${l.budgetId}|${l.concept}|${l.descriptionTouched ? 1 : 0}`).join(';');
  useEffect(() => {
    setLines((prev) => {
      let changed = false;
      const next = prev.map((l) => {
        if (l.concept === 'other' || l.descriptionTouched || l.budgetId === null || !detailOf(l.budgetId)) return l;
        const standard = defaultDescription(l);
        if (standard === l.description) return l;
        changed = true;
        return { ...l, description: standard };
      });
      return changed ? next : prev;
    });
    // defaultDescription / detailOf dependen de blocks y la moneda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptionsKey, blocks, currency]);

  // Al corregir una factura, lo guardado que coincide con el texto estándar vuelve a ser automático; lo distinto se respeta como escrito a mano. Una sola vez, con los presupuestos ya cargados.
  const descriptionsChecked = useRef(false);
  useEffect(() => {
    if (!open) { descriptionsChecked.current = false; return; }
    if (!invoice || descriptionsChecked.current || lines.length === 0) return;
    if (lines.some((l) => l.budgetId !== null && !detailOf(l.budgetId))) return;
    descriptionsChecked.current = true;
    setLines((prev) => prev.map((l) => (l.concept !== 'other' && l.budgetId !== null && l.description && l.description === defaultDescription(l) ? { ...l, descriptionTouched: false } : l)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice, blocks, lines.length]);

  // Un bloque por presupuesto: sus líneas, "Facturar todo el saldo" y los conceptos que todavía se pueden agregar.
  const renderBudgetBlock = (block: BudgetBillingDetail) => {
    const id = block.budget.id;
    const blockLines = lines.filter((l) => l.budgetId === id);
    const addable = (['materials', 'labor'] as const).filter((concept) => {
      if (budgetBalance(id, currency, concept) <= TOLERANCE) return false;
      const taken = lines.filter((l) => l.budgetId === id && l.concept === concept);
      const hasFreeOrder = ordersFor(id, concept).some((o) => !taken.some((l) => l.orderId === o.id));
      return taken.length === 0 || hasFreeOrder;
    });
    return (
      <Box key={id} sx={isMulti ? { border: 1, borderColor: 'primary.light', borderRadius: 2, p: 2 } : undefined}>
        <Stack spacing={1.5}>
          <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Box sx={{ flex: 1, minWidth: 140 }}>
              <Typography variant="subtitle1" fontWeight={700}>{isMulti ? `${block.budget.number} · ${block.budget.title}` : 'Qué se factura'}</Typography>
              {isMulti && <Typography variant="caption" color="text.secondary">Qué se factura de este presupuesto</Typography>}
            </Box>
            <Button size="small" variant="outlined" onClick={() => fillAllBalance(id)}
              disabled={!(['materials', 'labor'] as const).some((c) => budgetBalance(id, currency, c) > TOLERANCE)}>
              Facturar todo el saldo
            </Button>
            {isMulti && (
              <IconButton size="small" aria-label={`Quitar ${block.budget.number} de la factura`} onClick={() => removeBlock(id)}><DeleteIcon fontSize="small" /></IconButton>
            )}
          </Box>
          {blockLines.map(renderBudgetLine)}
          <Box display="flex" gap={1} flexWrap="wrap">
            {addable.map((concept) => (
              <Button key={concept} size="small" onClick={() => addConceptLine(id, concept)}>
                + Agregar {CONCEPT_LABELS[concept].toLowerCase()}
              </Button>
            ))}
          </Box>
          {blockLines.length === 0 && addable.length === 0 && (
            <Alert severity="info">Este presupuesto no tiene saldo para facturar en {currency}.</Alert>
          )}
        </Stack>
      </Box>
    );
  };

  const renderFreeLine = (line: LineState) => (
    <Box key={line.key} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
        <TextField
          label="Descripción *" fullWidth value={line.description}
          onChange={(e) => updateLine(line.key, { description: e.target.value })}
        />
        <CurrencyInput
          label="Monto (neto) *" currency={currency} fullWidth
          value={line.amount} onChange={(v) => updateLine(line.key, { amount: v, source: 'amount' })}
        />
        <IconButton
          size="small" disabled={lines.length === 1} aria-label="Quitar línea"
          onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );

  const budgetClient = contextClient;

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle>
        {isEditing ? (isArca ? 'Editar borrador' : 'Corregir factura') : isFree ? 'Factura libre' : !detail ? 'Nueva factura (OCA)' : isArca ? 'Nueva factura (emitir por ARCA)' : 'Nueva factura'}
        {detail && (
          <Typography variant="body2" color="text.secondary">
            {isMulti ? `${blocks.length} presupuestos: ${blocks.map((b) => b.budget.number).join(', ')}` : `${detail.budget.number} · ${detail.budget.title}`}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />

          {!isEditing && (detail || ocaMode) && arcaOptions?.enabled && arcaOptions.points_of_sale.length > 0 && (
            <ToggleButtonGroup
              exclusive fullWidth size="small" color="primary" value={mode}
              onChange={(_, value) => { if (value) setMode(value); }}
            >
              <ToggleButton value="arca">Emitir por ARCA</ToggleButton>
              <ToggleButton value="manual">Cargar una ya emitida</ToggleButton>
            </ToggleButtonGroup>
          )}

          {isArca && arcaOptions && (
            <>
              <Alert severity={arcaOptions.env === 'produccion' ? 'warning' : 'info'}>
                {arcaOptions.env === 'homologacion'
                  ? 'Ambiente de PRUEBAS de ARCA: la factura que se emita no tiene validez fiscal. '
                  : ''}
                Se guarda como <strong>borrador</strong>: después la emitís en ARCA desde el listado de facturas, y ARCA le asigna el número.
              </Alert>
              {arcaOptions.issuer_missing.length > 0 && (
                <Alert severity="warning">
                  Faltan datos de la empresa para emitir ({arcaOptions.issuer_missing.join(', ')}). Completalos en Configuración → Datos de mi empresa.
                </Alert>
              )}
            </>
          )}

          {isEditing && !isArca && (
            <Alert severity="info">
              Estás corrigiendo una factura ya cargada. Usalo para arreglar un dato mal cargado
              (por ejemplo el número); si la factura real se anuló, usá “Anular”. Cada corrección
              queda registrada.
            </Alert>
          )}

          {budgetClient && (
            <ClientBanner
              name={budgetClient.razonSocial} cuit={budgetClient.cuit}
              detail={budgetClient.tax_condition ? TAX_CONDITION_LABELS[budgetClient.tax_condition] : undefined}
            />
          )}

          {isFree && (
            <>
              <Alert severity="info">
                La factura libre sirve para proyectos que no tienen presupuesto en el sistema (por ejemplo, anteriores a este módulo).
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Autocomplete
                  fullWidth options={clients} value={client}
                  getOptionLabel={(c) => c.razonSocial}
                  onChange={(_, value) => { setClient(value); setProject(null); }}
                  renderInput={(params) => <TextField {...params} label="Cliente *" />}
                />
                <Autocomplete
                  fullWidth options={projectOptions} value={project} disabled={!client}
                  getOptionLabel={(p) => `${p.code} · ${p.name}`}
                  onChange={(_, value) => setProject(value)}
                  renderInput={(params) => <TextField {...params} label="Proyecto (opcional)" />}
                />
              </Stack>
            </>
          )}

          {/* Encabezado */}
          {isArca ? (
            <Stack spacing={2}>
            <TextField select label="Tipo de comprobante *" value={arcaCbte} fullWidth onChange={(e) => setArcaCbte(Number(e.target.value) as 1 | 201)}
              helperText="Se elige a mano. La Factura de Crédito Electrónica (FCE) es para clientes que ARCA obliga a recibirla (grandes empresas): con ellos, una Factura A común puede ser rechazada.">
              <MenuItem value={1}>Factura A</MenuItem>
              <MenuItem value={FCE_CBTE_TIPO}>Factura de Crédito Electrónica MiPyMEs (FCE) A</MenuItem>
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField select label="Punto de venta *" value={posId} fullWidth onChange={(e) => setPosId(Number(e.target.value))}
                helperText="Solo los de tipo web service, de Datos de mi empresa.">
                {(arcaOptions?.points_of_sale || []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{String(p.number).padStart(4, '0')}{p.usage_description ? ` — ${p.usage_description}` : ''}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Concepto *" value={concept} fullWidth
                onChange={(e) => { setConcept(Number(e.target.value) as 1 | 2 | 3); setConceptTouched(true); }}
                helperText="Con servicios, ARCA pide el período facturado y el vencimiento de pago.">
                {([1, 2, 3] as const).map((c) => <MenuItem key={c} value={c}>{ARCA_CONCEPT_LABELS[c]}</MenuItem>)}
              </TextField>
            </Stack>
            </Stack>
          ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Tipo de comprobante *" value={voucherType} fullWidth onChange={(e) => {
              const next = e.target.value as VoucherType;
              setVoucherType(next);
              if (next !== 'sin_factura') setCbteTipo(DEFAULT_CBTE_BY_LETTER[next]);
            }}>
              {voucherOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            {!isUnofficial && (
              <TextField select label="Clase *" value={cbteTipo} fullWidth onChange={(e) => setCbteTipo(Number(e.target.value))}
                sx={{ minWidth: { sm: 220 } }}>
                {CBTE_OPTIONS_BY_LETTER[voucherType as 'A' | 'B' | 'C' | 'E'].map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            )}
            {!isUnofficial && (
              <>
                <TextField
                  label="Punto de venta *" value={posNumber} sx={{ minWidth: 150 }}
                  onChange={(e) => setPosNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  inputProps={{ inputMode: 'numeric' }} placeholder="0001"
                />
                <TextField
                  label="Número *" value={number} fullWidth
                  onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  inputProps={{ inputMode: 'numeric' }} placeholder="00001234"
                />
              </>
            )}
          </Stack>
          )}
          {isUnofficial && !isArca && (
            <Alert severity="warning">
              Cobro sin comprobante fiscal: no lleva número ni IVA. Igual descuenta del saldo del presupuesto.
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <DateField label="Fecha de emisión *" value={issueDate} onChange={setIssueDate} fullWidth />
            <DateField label={isArca && (concept !== 1 || isFce) ? 'Vencimiento de pago *' : 'Vencimiento de pago'} value={dueDate} onChange={setDueDate} fullWidth />
            {isEditing && invoice?.status === 'paid' && (
              <DateField label="Fecha de cobro" value={paidAt} onChange={setPaidAt} fullWidth />
            )}
          </Stack>

          {isArca && concept !== 1 && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateField label="Período facturado: desde (opcional)" value={serviceFrom} onChange={setServiceFrom} fullWidth helperText="Vacío, se usa la fecha de emisión." />
              <DateField label="Período facturado: hasta (opcional)" value={serviceTo} onChange={setServiceTo} fullWidth helperText="Vacío, se usa la fecha de emisión." />
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select label="Moneda *" value={currency} fullWidth
              onChange={(e) => handleCurrencyChange(e.target.value as BudgetCurrency)}
              helperText={ocaItems.length > 0 ? 'Las OCA se facturan en pesos.' : detail ? 'Una moneda por factura. Si el presupuesto tiene las dos, se hacen facturas separadas.' : undefined}
            >
              {(ocaItems.length > 0 ? (['ARS'] as BudgetCurrency[]) : detail ? [...new Set([...currencyOptions, currency])] : CURRENCIES).map((cur) => (
                <MenuItem key={cur} value={cur}>{cur === 'ARS' ? 'Pesos (ARS)' : 'Dólares (USD)'}</MenuItem>
              ))}
            </TextField>
            {currency === 'USD' && (
              <TextField
                label={isArca ? 'Cotización *' : 'Cotización (opcional)'} value={exchangeRate} fullWidth
                onChange={(e) => setExchangeRate(sanitizeRateInput(e.target.value))}
                inputProps={{ inputMode: 'decimal' }}
                helperText={isArca ? 'Se precarga con la de ARCA. Si se cobra en dólares, ARCA usa la suya.' : 'Solo informativa.'}
                InputProps={isArca ? { endAdornment: (
                  <InputAdornment position="end">
                    <Button size="small" onClick={loadArcaRate} disabled={rateLoading}>{rateLoading ? '…' : 'Traer de ARCA'}</Button>
                  </InputAdornment>
                ) } : undefined}
              />
            )}
            {!isUnofficial && (
              <TextField select label="Alícuota de IVA" value={ivaRate} fullWidth onChange={(e) => setIvaRate(Number(e.target.value))}>
                {rateOptions.map((rate) => <MenuItem key={rate} value={rate}>{formatPercent(rate)}</MenuItem>)}
              </TextField>
            )}
          </Stack>

          <Divider />

          {/* Líneas */}
          {detail ? (
            <>
              {blocks.map(renderBudgetBlock)}
              {lines.length === 0 && currencyOptions.length === 0 && (
                <Alert severity="info">{isMulti ? 'Estos presupuestos ya no tienen' : 'Este presupuesto ya no tiene'} saldo para facturar.</Alert>
              )}
              {/* Una factura puede cobrar varios presupuestos del mismo cliente (cada uno descuenta de su saldo). */}
              <Autocomplete
                key={blocks.length}
                options={pickable.filter((row) => !blocks.some((b) => b.budget.id === row.id))}
                getOptionLabel={(row) => `${row.number} · ${row.title}`}
                loading={loadingBlock} disabled={loadingBlock}
                noOptionsText="El cliente no tiene otros presupuestos aprobados"
                onChange={(_, row) => addBlock(row)}
                renderInput={(params) => <TextField {...params} size="small" label="Agregar otro presupuesto del mismo cliente" helperText="Una sola factura puede cobrar varios presupuestos: cada línea descuenta del saldo del suyo." />}
              />
            </>
          ) : isFree ? (
            <>
              <Typography variant="subtitle1" fontWeight={700}>Conceptos</Typography>
              {lines.map(renderFreeLine)}
              <Box>
                <Button size="small" onClick={() => setLines((prev) => [...prev, { key: newKey(), budgetId: null, orderId: null, concept: 'other', percentText: '', amount: null, description: '', source: 'amount' }])}>
                  + Agregar línea
                </Button>
              </Box>
            </>
          ) : null}

          {/* OCA: se cobran enteras, con el importe que sale de sus horas (FLOWS.md §74) */}
          {!isFree && (ocaItems.length > 0 || pickableOcas.length > 0) && (
            <>
              {ocaItems.length > 0 && <Typography variant="subtitle1" fontWeight={700}>OCA que se facturan</Typography>}
              {ocaItems.map((item) => (
                <Box key={item.id} sx={{ border: 1, borderColor: 'primary.light', borderRadius: 2, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>OCA {item.number} · {item.type === 'man_hours' ? 'Horas hombre' : 'Servicio de grúa'}</Typography>
                      <Typography variant="body2">Neto: <strong>{formatMoney(item.netAmount, 'ARS')}</strong></Typography>
                      <Typography variant="caption" color="text.secondary" display="block">Se factura entera; el importe sale de las horas y del valor hora de la OCA.</Typography>
                    </Box>
                    <IconButton size="small" aria-label={`Quitar la OCA ${item.number}`} onClick={() => setOcaItems((prev) => prev.filter((o) => o.id !== item.id))}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                  <TextField
                    size="small" fullWidth label="Descripción en la factura" value={item.description} sx={{ mt: 1.5 }} inputProps={{ maxLength: 255 }}
                    onChange={(e) => setOcaItems((prev) => prev.map((o) => (o.id === item.id ? { ...o, description: e.target.value } : o)))}
                    helperText="Podés dejarla así o cambiarla, por ejemplo: Hora hombre, construcción 4773 OC 117242-104."
                  />
                </Box>
              ))}
              <Autocomplete
                key={`oca-${ocaItems.length}`}
                options={pickableOcas.filter((o) => !ocaItems.some((i) => i.id === o.id))}
                getOptionLabel={(o) => `OCA ${o.number} · ${formatMoney(o.net_amount, 'ARS')}${o.project ? ` · ${o.project.code}` : ''}`}
                noOptionsText="El cliente no tiene OCA aprobadas para facturar"
                onChange={(_, o) => {
                  if (!o) return;
                  setOcaItems((prev) => [...prev, { id: o.id, number: o.number, type: o.type, netAmount: o.net_amount, description: ocaDefaultDescription(o.type, o.number) }]);
                  setCurrency('ARS');
                  // Los saldos y la moneda cambian: las líneas de presupuesto cargadas en otra moneda dejan de servir.
                  if (currency !== 'ARS') setLines([]);
                }}
                renderInput={(params) => <TextField {...params} size="small" label="Agregar una OCA del cliente" helperText="OCA aprobadas, con su valor hora cargado y todavía sin facturar. Se facturan en pesos." />}
              />
            </>
          )}

          {/* Receptor y datos opcionales del comprobante (solo emisión por ARCA) */}
          {isArca && arcaOptions && (
            <>
              {isFce && (
                <>
                  <Divider />
                  <Typography variant="subtitle1" fontWeight={700}>Factura de Crédito Electrónica</Typography>
                  {arcaOptions.bank_accounts.length === 0 && (
                    <Alert severity="warning">
                      No hay cuentas bancarias cargadas. La FCE informa el CBU del emisor: cargá una en Configuración → Datos de mi empresa.
                    </Alert>
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      select label="Cuenta bancaria del emisor (CBU) *" value={bankAccountId} fullWidth
                      onChange={(e) => setBankAccountId(e.target.value === '' ? '' : Number(e.target.value))}
                      helperText="Se informa a ARCA y se imprime en la factura."
                    >
                      {arcaOptions.bank_accounts.map((a) => {
                        const usable = !a.currency || a.currency === currency;
                        return (
                          <MenuItem key={a.id} value={a.id} disabled={!usable}>
                            {a.bank_name}{a.alias ? ` · ${a.alias}` : ''} · {a.cbu}{a.currency ? ` (${a.currency})` : ''}{!usable ? ' — otra moneda' : ''}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                    <TextField
                      select label="Opción de transferencia *" value={fceTransfer} fullWidth
                      onChange={(e) => setFceTransfer(e.target.value as 'SCA' | 'ADC')}
                      helperText="Se precarga con la del cliente o, si no tiene, la de la empresa."
                    >
                      {(['SCA', 'ADC'] as const).map((o) => <MenuItem key={o} value={o}>{FCE_TRANSFER_LABELS[o]}</MenuItem>)}
                    </TextField>
                  </Stack>
                </>
              )}

              <Divider />
              <Typography variant="subtitle1" fontWeight={700}>Receptor</Typography>
              {budgetClient && (!budgetClient.cuit || !budgetClient.tax_condition) && (
                <Alert severity="warning">
                  {budgetClient.razonSocial} no tiene {!budgetClient.cuit ? 'CUIT' : 'condición frente al IVA'} cargado: ARCA lo exige para una Factura A.
                  Completalo en Clientes antes de emitir (el borrador se puede guardar igual).
                </Alert>
              )}
              <TextField
                select label="Condición frente al IVA del receptor *" value={recipientVatId} fullWidth
                onChange={(e) => setRecipientVatId(e.target.value === '' ? '' : Number(e.target.value))}
                helperText="ARCA lo exige desde el 1/12/2026. Para una Factura A: Responsable Inscripto o Monotributo."
              >
                {arcaOptions.receiver_vat_conditions.map((c) => <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>)}
              </TextField>
              {currency === 'USD' && (
                <FormControlLabel
                  control={<Switch checked={sameCurrency} onChange={(e) => setSameCurrency(e.target.checked)} />}
                  label="Se cobra en dólares (la misma moneda de la factura)"
                />
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField label="Condición de venta" value={saleCondition} fullWidth onChange={(e) => setSaleCondition(e.target.value)} inputProps={{ maxLength: 60 }} />
                <TextField label="Remito" value={remito} fullWidth onChange={(e) => setRemito(e.target.value)} inputProps={{ maxLength: 30 }} />
              </Stack>
              <TextField
                label="Referencia comercial (por ejemplo, el número de OC)" value={commercialRef} fullWidth
                onChange={(e) => { setCommercialRef(e.target.value); setCommercialTouched(true); }} inputProps={{ maxLength: isFce ? 50 : 255 }}
                helperText={isFce ? 'Se informa a ARCA y se imprime (hasta 50 caracteres). Bunge exige el número de OC.' : 'Se imprime en la factura.'}
              />
            </>
          )}

          {/* Totales en vivo */}
          <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            <Box display="flex" justifyContent="space-between"><Typography variant="body2">Neto</Typography><Typography variant="body2">{formatMoney(net, currency)}</Typography></Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">IVA {formatPercent(effectiveIvaRate)}</Typography>
              <Typography variant="body2">{formatMoney(iva, currency)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mt={0.5}>
              <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
              <Typography variant="subtitle1" fontWeight={700}>{formatMoney(total, currency)}</Typography>
            </Box>
            {currency === 'USD' && Number(exchangeRate.replace(',', '.')) > 0 && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">Total en pesos (cotización {exchangeRate})</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatMoney(roundMoney(total * roundRate(Number(exchangeRate.replace(',', '.')))), 'ARS')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* PDF y notas. En una factura por ARCA el PDF lo genera el sistema (no se adjunta uno a mano). */}
          {!isArca && (
          <Box>
            <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
              {file ? file.name : invoice?.file_name ? 'Reemplazar PDF' : 'Adjuntar PDF'}
              <input hidden type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </Button>
            {!file && invoice?.file_name && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Actual: {invoice.file_name}</Typography>
            )}
          </Box>
          )}
          <TextField label="Notas" multiline minRows={2} fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Guardando…' : isArca ? 'Guardar borrador' : isEditing ? 'Guardar corrección' : 'Registrar factura'}
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
