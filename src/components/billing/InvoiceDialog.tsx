'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton,
  InputAdornment, MenuItem, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { DeleteOutline as DeleteIcon, UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import CurrencyInput from '../CurrencyInput';
import DateField from '../DateField';
import {
  BudgetBillingDetail, BudgetCurrency, Invoice, InvoiceArcaOptions, InvoiceClientOption, InvoiceConcept, InvoiceInput,
  InvoiceLineInput, InvoiceProjectOption, InvoiceService, IvaInfo, VoucherType,
} from '../../utils/api';
import {
  ARCA_CONCEPT_LABELS, CBTE_OPTIONS_BY_LETTER, CONCEPT_LABELS, DEFAULT_CBTE_BY_LETTER, formatHours, formatMoney, formatPercent,
  ivaOf, roundMoney, roundPercent, todayISO, VOUCHER_TYPE_OPTIONS,
} from '../../utils/billing';
import { formatCuit, TAX_CONDITION_LABELS } from '../../utils/cuit';

interface InvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (invoice: Invoice) => void;
  // Detalle de facturación del presupuesto a facturar. Sin él, es una factura libre.
  detail?: BudgetBillingDetail | null;
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
  concept: InvoiceConcept;
  percentText: string;
  amount: number | null;
  description: string;
  source: 'percent' | 'amount';
}

const CURRENCIES: BudgetCurrency[] = ['ARS', 'USD'];
const TOLERANCE = 0.01;
let lineCounter = 0;
const newKey = () => `line-${++lineCounter}`;

const parsePercent = (text: string): number => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function InvoiceDialog({ open, onClose, onSaved, detail, invoice, ivaInfo, canUnofficial }: InvoiceDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = !!invoice;
  const isFree = !detail;
  const billing = detail?.billing;
  const ownBudgetInvoice = isEditing && !!detail && invoice?.budget_id === detail.budget.id && invoice?.status !== 'cancelled';

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
  const isArca = mode === 'arca';

  // Saldo disponible de un concepto en la moneda elegida. Al corregir, el monto de la propia
  // factura vuelve a estar disponible (el servidor lo excluye del cálculo igual).
  const availableFor = (cur: BudgetCurrency, concept: 'materials' | 'labor'): number => {
    if (!billing) return 0;
    let available = billing.balances[cur][concept];
    if (ownBudgetInvoice && invoice && invoice.currency === cur) {
      const own = invoice.lines.find((l) => l.concept === concept);
      if (own) available = roundMoney(available + own.net_amount);
    }
    return available;
  };

  const currencyOptions = useMemo(() => {
    if (!billing) return CURRENCIES;
    return CURRENCIES.filter((cur) => (['materials', 'labor'] as const).some((c) => billing.bases[cur][c].net > TOLERANCE && availableFor(cur, c) > TOLERANCE));
    // availableFor depende de billing, invoice y ownBudgetInvoice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing, invoice, ownBudgetInvoice]);

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
      setExchangeRate(invoice.exchange_rate ? String(invoice.exchange_rate) : '');
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
      setSameCurrency(!!invoice.same_currency_payment);
      setSaleCondition(invoice.sale_condition || '');
      setRemito(invoice.remito_number || '');
      setCommercialRef(invoice.commercial_reference || '');
      setLines(invoice.lines.map((l) => ({
        key: newKey(),
        concept: l.concept,
        percentText: l.percent != null ? String(l.percent) : '',
        amount: l.net_amount,
        description: l.description || '',
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
      setSameCurrency(false);
      setSaleCondition('');
      setRemito('');
      setCommercialRef('');
      setLines(detail ? [] : [{ key: newKey(), concept: 'other', percentText: '', amount: null, description: '', source: 'amount' }]);
      // Con presupuesto, la moneda por defecto es la primera que todavía tenga saldo.
      setCurrency(detail && currencyOptions.length > 0 ? currencyOptions[0] : 'ARS');
    }
    setClient(null);
    setProject(null);
    // Solo al abrir: no queremos pisar lo que el usuario esté escribiendo si cambia el padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice, detail?.budget.id]);

  // Opciones de ARCA: solo para facturas de un presupuesto (la factura libre se sigue cargando a mano). Si la integración
  // está prendida y hay puntos de venta de web service, una factura nueva arranca como "Emitir por ARCA".
  useEffect(() => {
    if (!open || !detail) { setArcaOptions(null); return; }
    let cancelled = false;
    InvoiceService.getArcaOptions().then((opts) => {
      if (cancelled) return;
      setArcaOptions(opts);
      if (!invoice && opts.enabled && opts.points_of_sale.length > 0) {
        setMode('arca');
        const def = opts.points_of_sale.find((p) => p.is_default) || opts.points_of_sale[0];
        setPosId(def.id);
      }
      const client = detail.budget.client;
      const mapped = client?.tax_condition ? opts.client_tax_condition_map[client.tax_condition] : undefined;
      if (!invoice && mapped) setRecipientVatId(mapped);
    }).catch(() => { if (!cancelled) setArcaOptions(null); });
    return () => { cancelled = true; };
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detail?.budget.id, invoice]);

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

  // En dólares, la cotización se precarga con la de ARCA (la que usa la web de ARCA), editable.
  const loadArcaRate = async () => {
    setRateLoading(true);
    setError('');
    try {
      const quote = await InvoiceService.getArcaExchangeRate();
      setExchangeRate(String(quote.rate));
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

  const net = roundMoney(lines.reduce((acc, l) => acc + (l.amount || 0), 0));
  const iva = ivaOf(net, effectiveIvaRate);
  const total = roundMoney(net + iva);

  const baseFor = (concept: InvoiceConcept) => (billing && concept !== 'other' ? billing.bases[currency][concept] : null);

  const updateLine = (key: string, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const handlePercent = (line: LineState, text: string) => {
    const base = baseFor(line.concept);
    const pct = parsePercent(text);
    updateLine(line.key, {
      percentText: text,
      source: 'percent',
      amount: base && pct > 0 ? roundMoney((base.net * pct) / 100) : null,
    });
  };

  const handleAmount = (line: LineState, value: number | null) => {
    const base = baseFor(line.concept);
    updateLine(line.key, {
      amount: value,
      source: 'amount',
      percentText: base && value ? String(roundPercent((value / base.net) * 100)) : '',
    });
  };

  const addConceptLine = (concept: 'materials' | 'labor') =>
    setLines((prev) => (prev.some((l) => l.concept === concept)
      ? prev
      : [...prev, { key: newKey(), concept, percentText: '', amount: null, description: '', source: 'amount' }]));

  // "Facturar todo el saldo": cada concepto con saldo en esta moneda, al 100% de lo que queda.
  const fillAllBalance = () => {
    if (!billing) return;
    const next: LineState[] = [];
    (['materials', 'labor'] as const).forEach((concept) => {
      const available = availableFor(currency, concept);
      const base = billing.bases[currency][concept];
      if (base.net > TOLERANCE && available > TOLERANCE) {
        next.push({
          key: lines.find((l) => l.concept === concept)?.key || newKey(),
          concept,
          percentText: String(roundPercent((available / base.net) * 100)),
          amount: available,
          description: '',
          source: 'amount',
        });
      }
    });
    setLines(next);
  };

  const handleCurrencyChange = (cur: BudgetCurrency) => {
    if (cur === currency) return;
    setCurrency(cur);
    // Los saldos son por moneda: las líneas cargadas dejan de tener sentido.
    if (detail) setLines([]);
  };

  const validate = (): string | null => {
    if (!issueDate) return 'La fecha de emisión es obligatoria.';
    if (isArca) {
      if (!posId) return 'Elegí el punto de venta.';
      if (concept !== 1) {
        if (!serviceFrom || !serviceTo) return 'Con servicios hay que indicar el período facturado (desde y hasta).';
        if (serviceFrom > serviceTo) return 'El período facturado es inválido: la fecha desde es posterior a la fecha hasta.';
        if (!dueDate) return 'Con servicios hay que indicar el vencimiento de pago.';
      }
      if (currency === 'USD' && !(Number(exchangeRate.replace(',', '.')) > 0)) return 'En dólares hace falta la cotización.';
    } else if (!isUnofficial) {
      const pos = Number(posNumber);
      const num = Number(number);
      if (!Number.isInteger(pos) || pos < 1 || pos > 99999) return 'Ingresá el punto de venta (1 a 99999).';
      if (!Number.isInteger(num) || num < 1 || num > 99999999) return 'Ingresá el número de comprobante.';
    }
    if (isFree && !client) return 'Elegí el cliente.';
    if (lines.length === 0) return 'Agregá al menos un concepto a facturar.';
    for (const line of lines) {
      if (!(line.amount && line.amount > 0)) return `Indicá el monto o el porcentaje de ${CONCEPT_LABELS[line.concept].toLowerCase()}.`;
      if (line.concept === 'other' && !line.description.trim()) return 'Cada línea necesita una descripción.';
      if (line.concept !== 'other' && line.amount > availableFor(currency, line.concept) + TOLERANCE) {
        return `El monto de ${CONCEPT_LABELS[line.concept].toLowerCase()} supera el saldo disponible.`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    const lineInputs: InvoiceLineInput[] = lines.map((l) => {
      if (l.concept === 'other') return { concept: 'other', description: l.description.trim(), net_amount: l.amount || 0 };
      return l.source === 'percent' && parsePercent(l.percentText) > 0
        ? { concept: l.concept, percent: parsePercent(l.percentText) }
        : { concept: l.concept, net_amount: l.amount || 0 };
    });

    const arcaFields: Partial<InvoiceInput> = isArca ? {
      source: 'arca',
      point_of_sale_id: Number(posId),
      arca_concept: concept,
      service_from: concept === 1 ? null : serviceFrom,
      service_to: concept === 1 ? null : serviceTo,
      recipient_vat_condition_id: recipientVatId === '' ? null : Number(recipientVatId),
      same_currency_payment: currency === 'USD' ? sameCurrency : null,
      sale_condition: saleCondition.trim() || null,
      remito_number: remito.trim() || null,
      commercial_reference: commercialRef.trim() || null,
    } : {};

    const input: InvoiceInput = {
      voucher_type: isArca ? 'A' : voucherType,
      cbte_tipo: isArca || isUnofficial ? null : cbteTipo,
      ...arcaFields,
      pos_number: isArca || isUnofficial ? null : Number(posNumber),
      number: isArca || isUnofficial ? null : Number(number),
      issue_date: issueDate,
      due_date: dueDate || null,
      currency,
      exchange_rate: currency === 'USD' && exchangeRate ? Number(exchangeRate.replace(',', '.')) : null,
      iva_rate: effectiveIvaRate,
      budget_id: detail ? detail.budget.id : null,
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

  const renderBudgetLine = (line: LineState) => {
    if (line.concept === 'other') return null;
    const concept = line.concept;
    const base = billing!.bases[currency][concept];
    const available = availableFor(currency, concept);
    const progress = billing!.project_progress;
    const pct = parsePercent(line.percentText);
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

  const budgetClient = detail?.budget.client;

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle>
        {isEditing ? (isArca ? 'Editar borrador' : 'Corregir factura') : isFree ? 'Factura libre' : isArca ? 'Nueva factura (emitir por ARCA)' : 'Nueva factura'}
        {detail && (
          <Typography variant="body2" color="text.secondary">
            {detail.budget.number} · {detail.budget.title}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          {!isEditing && detail && arcaOptions?.enabled && arcaOptions.points_of_sale.length > 0 && (
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
            <Typography variant="body2" color="text.secondary">
              Cliente: <strong>{budgetClient.razonSocial}</strong>
              {budgetClient.cuit ? ` · CUIT ${formatCuit(budgetClient.cuit)}` : ''}
              {budgetClient.tax_condition ? ` · ${TAX_CONDITION_LABELS[budgetClient.tax_condition]}` : ''}
            </Typography>
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
            <DateField label={isArca && concept !== 1 ? 'Vencimiento de pago *' : 'Vencimiento de pago'} value={dueDate} onChange={setDueDate} fullWidth />
            {isEditing && invoice?.status === 'paid' && (
              <DateField label="Fecha de cobro" value={paidAt} onChange={setPaidAt} fullWidth />
            )}
          </Stack>

          {isArca && concept !== 1 && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateField label="Período facturado: desde *" value={serviceFrom} onChange={setServiceFrom} fullWidth />
              <DateField label="Período facturado: hasta *" value={serviceTo} onChange={setServiceTo} fullWidth />
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select label="Moneda *" value={currency} fullWidth
              onChange={(e) => handleCurrencyChange(e.target.value as BudgetCurrency)}
              helperText={detail ? 'Una moneda por factura. Si el presupuesto tiene las dos, se hacen facturas separadas.' : undefined}
            >
              {(detail ? [...new Set([...currencyOptions, currency])] : CURRENCIES).map((cur) => (
                <MenuItem key={cur} value={cur}>{cur === 'ARS' ? 'Pesos (ARS)' : 'Dólares (USD)'}</MenuItem>
              ))}
            </TextField>
            {currency === 'USD' && (
              <TextField
                label={isArca ? 'Cotización *' : 'Cotización (opcional)'} value={exchangeRate} fullWidth
                onChange={(e) => setExchangeRate(e.target.value.replace(/[^\d.,]/g, ''))}
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
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, minWidth: 140 }}>Qué se factura</Typography>
                <Button size="small" variant="outlined" onClick={fillAllBalance}
                  disabled={!(['materials', 'labor'] as const).some((c) => availableFor(currency, c) > TOLERANCE)}>
                  Facturar todo el saldo
                </Button>
              </Box>
              {lines.map(renderBudgetLine)}
              <Box display="flex" gap={1} flexWrap="wrap">
                {(['materials', 'labor'] as const).map((concept) => {
                  const available = availableFor(currency, concept);
                  const taken = lines.some((l) => l.concept === concept);
                  if (taken || !(available > TOLERANCE)) return null;
                  return (
                    <Button key={concept} size="small" onClick={() => addConceptLine(concept)}>
                      + Agregar {CONCEPT_LABELS[concept].toLowerCase()}
                    </Button>
                  );
                })}
              </Box>
              {lines.length === 0 && currencyOptions.length === 0 && (
                <Alert severity="info">Este presupuesto ya no tiene saldo para facturar.</Alert>
              )}
            </>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={700}>Conceptos</Typography>
              {lines.map(renderFreeLine)}
              <Box>
                <Button size="small" onClick={() => setLines((prev) => [...prev, { key: newKey(), concept: 'other', percentText: '', amount: null, description: '', source: 'amount' }])}>
                  + Agregar línea
                </Button>
              </Box>
            </>
          )}

          {/* Receptor y datos opcionales del comprobante (solo emisión por ARCA) */}
          {isArca && arcaOptions && (
            <>
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
                onChange={(e) => setCommercialRef(e.target.value)} inputProps={{ maxLength: 255 }}
                helperText="Se imprime en la factura."
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
                  {formatMoney(roundMoney(total * Number(exchangeRate.replace(',', '.'))), 'ARS')}
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
