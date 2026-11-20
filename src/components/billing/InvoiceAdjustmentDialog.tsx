'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle, FormControlLabel, InputAdornment, MenuItem, Stack, TextField, Typography,
  useMediaQuery, useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import ClientBanner from './ClientBanner';
import FeedbackModal from '../FeedbackModal';
import CurrencyInput from '../CurrencyInput';
import DateField from '../DateField';
import { AdjustmentType, Invoice, InvoiceArcaOptions, InvoiceInput, InvoiceLineInput, InvoiceService } from '../../utils/api';
import {
  ADJUSTMENT_TYPE_LABELS, CONCEPT_LABELS, formatDate, formatMoney, formatPercent, formatVoucher, ivaOf, roundMoney, roundPercent, todayISO,
} from '../../utils/billing';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (invoice: Invoice) => void;
  // La factura emitida que se ajusta, con `lines[].credited_net` (lo ya acreditado, que se resta de la base).
  original: Invoice | null;
  // Si viene, se está EDITANDO ese borrador de ajuste.
  editing?: Invoice | null;
}

interface AdjustLine {
  lineId: number;
  concept: 'materials' | 'labor';
  label: string;
  // Sobre qué se calcula: lo que queda de la línea después de las notas de crédito.
  base: number;
  blocked: string | null;
  selected: boolean;
  type: AdjustmentType;
  percentText: string;
  amount: number | null;
  source: 'percent' | 'amount';
  description: string;
  // true si la persona escribió la descripción; si no, es el texto estándar y se actualiza sola al cambiar el índice o el período.
  descriptionTouched: boolean;
  // Para armar el texto estándar: la OC y el presupuesto de la línea.
  orderNumber: string | null;
  budgetNumber: string | null;
}

// Mismo criterio que el servidor (services/adjustmentService.js): "Ajuste IPC INDEC (período) s/ Factura A 0003-00000001 – OC N – PRES-…".
const TYPE_TEXT: Record<AdjustmentType, string> = { ipc_indec: 'IPC INDEC', uocra: 'UOCRA', other: 'índice' };
const standardDescription = (line: Pick<AdjustLine, 'type' | 'orderNumber' | 'budgetNumber'>, period: string, originalLabel: string) =>
  [`Ajuste ${TYPE_TEXT[line.type]}${period.trim() ? ` (${period.trim()})` : ''} s/ ${originalLabel}`, line.orderNumber ? `OC ${line.orderNumber}` : null, line.budgetNumber].filter(Boolean).join(' – ');

const parsePercent = (text: string): number => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// "Crear ajuste" (FLOWS.md §71): el ajuste de precio (IPC, UOCRA…) es una FACTURA NUEVA vinculada a la original. Se guarda como borrador y se emite por ARCA
// como cualquier factura. No cambia el saldo del presupuesto ni de la OC.
export default function InvoiceAdjustmentDialog({ open, onClose, onSaved, original, editing }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const currency = original?.currency || 'ARS';
  const ivaRate = Number(original?.iva_rate || 0);
  const needsPeriod = !!original && original.arca_concept !== 1;

  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [serviceFrom, setServiceFrom] = useState('');
  const [serviceTo, setServiceTo] = useState('');
  const [posId, setPosId] = useState<number | ''>('');
  const [period, setPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<AdjustLine[]>([]);
  // Calculadora del IPC del INDEC (FLOWS.md §73): el % entre un mes base y otro (por defecto, el último publicado).
  const [ipcFrom, setIpcFrom] = useState('');
  const [ipcTo, setIpcTo] = useState('');
  const [ipcResult, setIpcResult] = useState<{ from: string; to: string; percent: number } | null>(null);
  const [ipcLoading, setIpcLoading] = useState(false);
  const [ipcError, setIpcError] = useState('');
  const [options, setOptions] = useState<InvoiceArcaOptions | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !original) return;
    setError('');
    setIssueDate(editing?.issue_date || todayISO());
    setDueDate(editing?.due_date || original.due_date || '');
    setServiceFrom(editing?.service_from || original.service_from || '');
    setServiceTo(editing?.service_to || original.service_to || '');
    setPosId(editing?.point_of_sale_id || original.point_of_sale_id || '');
    setPeriod('');
    setIpcFrom(original.issue_date.slice(0, 7));
    setIpcTo('');
    setIpcResult(null);
    setIpcError('');
    setNotes(editing?.notes || '');
    setLines((original.lines || []).filter((l) => l.concept === 'materials' || l.concept === 'labor').map((line) => {
      const own = editing?.lines.find((l) => l.adjusts_line_id === line.id);
      const base = roundMoney(Number(line.net_amount) - Number(line.credited_net || 0));
      const order = line.purchaseOrder;
      return {
        lineId: line.id as number,
        concept: line.concept as 'materials' | 'labor',
        label: [CONCEPT_LABELS[line.concept], line.budget?.number, line.purchaseOrder ? `OC ${line.purchaseOrder.number}` : null].filter(Boolean).join(' · '),
        base,
        blocked: order && !order.allows_adjustment ? `La OC ${order.number} no admite ajuste de precios.` : base <= 0.01 ? 'Ya está acreditada por completo.' : null,
        selected: !!own,
        type: (own?.adjustment_type || order?.adjustment_type || 'ipc_indec') as AdjustmentType,
        percentText: own?.adjustment_percent != null ? String(own.adjustment_percent) : '',
        amount: own ? Number(own.net_amount) : null,
        source: 'amount' as const,
        description: own?.description || '',
        // Lo guardado cuenta como escrito a mano salvo que coincida con el texto estándar (se verifica abajo).
        descriptionTouched: !!own?.description,
        orderNumber: line.purchaseOrder?.number || null,
        budgetNumber: line.budget?.number || null,
      };
    }));
    // Solo al abrir: no pisar lo que la persona esté escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, original?.id, editing?.id]);

  useEffect(() => {
    if (!open) return;
    InvoiceService.getArcaOptions().then(setOptions).catch(() => setOptions(null));
  }, [open]);

  // El texto estándar de las líneas que la persona no tocó sigue al índice y al período; lo que se ve en el campo es lo que se guarda.
  const originalLabel = original ? formatVoucher(original) : '';
  const descriptionsKey = lines.map((l) => `${l.lineId}|${l.type}|${l.descriptionTouched ? 1 : 0}`).join(';');
  useEffect(() => {
    if (!original) return;
    setLines((prev) => {
      let changed = false;
      const next = prev.map((l) => {
        if (l.descriptionTouched) return l;
        const standard = standardDescription(l, period, originalLabel);
        if (standard === l.description) return l;
        changed = true;
        return { ...l, description: standard };
      });
      return changed ? next : prev;
    });
    // original/originalLabel cambian solo al abrir otra factura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descriptionsKey, period, originalLabel]);

  // Al editar un borrador: lo guardado que coincide con el texto estándar (sin período) vuelve a ser automático.
  const descriptionsChecked = useRef(false);
  useEffect(() => {
    if (!open) { descriptionsChecked.current = false; return; }
    if (!editing || descriptionsChecked.current || lines.length === 0) return;
    descriptionsChecked.current = true;
    setLines((prev) => prev.map((l) => (l.description && l.description === standardDescription(l, '', originalLabel) ? { ...l, descriptionTouched: false } : l)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, lines.length]);

  const update = (lineId: number, patch: Partial<AdjustLine>) => setLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));
  const handlePercent = (line: AdjustLine, text: string) => {
    const pct = parsePercent(text);
    update(line.lineId, { percentText: text, source: 'percent', amount: pct > 0 ? roundMoney((line.base * pct) / 100) : null });
  };
  const handleAmount = (line: AdjustLine, value: number | null) =>
    update(line.lineId, { amount: value, source: 'amount', percentText: value ? String(roundPercent((value / line.base) * 100)) : '' });

  const calculateIpc = async () => {
    setIpcLoading(true);
    setIpcError('');
    setIpcResult(null);
    try {
      setIpcResult(await InvoiceService.getIpcVariation(ipcFrom, ipcTo || undefined));
    } catch (err) {
      setIpcError(err instanceof Error ? err.message : 'No se pudo consultar el IPC del INDEC');
    } finally {
      setIpcLoading(false);
    }
  };

  // Aplica el % del IPC a las líneas elegidas (las de índice IPC, o todas si ninguna lo es) y avisa el período en la descripción.
  const applyIpc = () => {
    if (!ipcResult) return;
    setLines((prev) => prev.map((l) => (l.selected
      ? { ...l, type: 'ipc_indec', source: 'percent', percentText: String(ipcResult.percent), amount: roundMoney((l.base * ipcResult.percent) / 100) }
      : l)));
    if (!period.trim()) setPeriod(`IPC ${ipcResult.from.split('-').reverse().join('/')} a ${ipcResult.to.split('-').reverse().join('/')}`);
  };

  const used = lines.filter((l) => l.selected);
  const net = roundMoney(used.reduce((acc, l) => acc + (l.amount || 0), 0));
  const iva = ivaOf(net, ivaRate);
  const total = roundMoney(net + iva);

  const validate = (): string | null => {
    if (!issueDate) return 'La fecha de la factura de ajuste es obligatoria.';
    if (original && issueDate < original.issue_date) return 'La fecha del ajuste no puede ser anterior a la de la factura.';
    if (!posId) return 'Elegí el punto de venta.';
    if (needsPeriod || original?.cbte_tipo === 201) {
      if (needsPeriod && (!serviceFrom || !serviceTo)) return 'Con servicios hay que indicar el período facturado (desde y hasta).';
      if (needsPeriod && serviceFrom > serviceTo) return 'El período facturado es inválido: la fecha desde es posterior a la fecha hasta.';
      if (!dueDate) return 'Indicá el vencimiento de pago.';
      if (dueDate < issueDate) return 'El vencimiento de pago no puede ser anterior a la fecha de emisión.';
    }
    if (used.length === 0) return 'Elegí al menos una línea para ajustar.';
    for (const line of used) {
      if (!((line.amount || 0) > 0)) return `Indicá el porcentaje o el monto del ajuste de ${CONCEPT_LABELS[line.concept].toLowerCase()}.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!original) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    const inputLines: InvoiceLineInput[] = used.map((l) => ({
      adjusts_line_id: l.lineId,
      adjustment_type: l.type,
      ...(l.source === 'percent' && parsePercent(l.percentText) > 0 ? { percent: parsePercent(l.percentText) } : { net_amount: l.amount || 0 }),
      ...(l.description.trim() ? { description: l.description.trim() } : {}),
    }));
    const input: InvoiceInput = {
      voucher_type: 'A',
      source: 'arca',
      adjusts_invoice_id: original.id,
      adjustment_period: period.trim() || null,
      issue_date: issueDate,
      due_date: dueDate || null,
      currency,
      point_of_sale_id: Number(posId),
      service_from: needsPeriod ? serviceFrom : null,
      service_to: needsPeriod ? serviceTo : null,
      notes: notes.trim() || null,
      lines: inputLines,
    };

    setSaving(true);
    setError('');
    try {
      onSaved(editing ? await InvoiceService.update(editing.id, input) : await InvoiceService.create(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el ajuste');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle>
        {editing ? 'Editar borrador de ajuste' : 'Crear ajuste'}
        {original && (
          <Typography variant="body2" color="text.secondary">{formatVoucher(original)}</Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {original && (
          <Stack spacing={2.5}>
            <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
            <ClientBanner name={original.client?.razonSocial} cuit={original.recipient_doc_number} detail={`Sobre ${formatVoucher(original)} · ${formatDate(original.issue_date)}`} />
            <Alert severity="info">
              El ajuste es una <strong>factura nueva</strong> por la diferencia (por ejemplo, 20% de $1.000.000 = una factura de $200.000), vinculada a esta.
              Se guarda como borrador y se emite en ARCA como cualquier factura. <strong>No cambia el saldo</strong> del presupuesto ni de la OC.
              Cada factura admite un solo ajuste vigente.
            </Alert>
            {options && options.env === 'homologacion' && (
              <Alert severity="warning">Ambiente de PRUEBAS de ARCA: la factura que se emita no tiene validez fiscal.</Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateField label="Fecha de la factura de ajuste *" value={issueDate} onChange={setIssueDate} fullWidth />
              <TextField select label="Punto de venta *" value={posId} fullWidth onChange={(e) => setPosId(Number(e.target.value))}>
                {(options?.points_of_sale || []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{String(p.number).padStart(4, '0')}{p.usage_description ? ` — ${p.usage_description}` : ''}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Período del ajuste (opcional)" value={period} fullWidth onChange={(e) => setPeriod(e.target.value)} inputProps={{ maxLength: 60 }}
                helperText='Sale en la descripción: "Ajuste IPC INDEC (Octubre 2026) s/ Factura A…".'
              />
              <DateField label={needsPeriod || original.cbte_tipo === 201 ? 'Vencimiento de pago *' : 'Vencimiento de pago'} value={dueDate} onChange={setDueDate} fullWidth />
            </Stack>
            {needsPeriod && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DateField label="Período facturado: desde *" value={serviceFrom} onChange={setServiceFrom} fullWidth />
                <DateField label="Período facturado: hasta *" value={serviceTo} onChange={setServiceTo} fullWidth />
              </Stack>
            )}

            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>Calcular con el IPC del INDEC (opcional)</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Calcula la variación acumulada entre dos meses con el índice oficial. El INDEC publica con un mes de demora. Después aplicás el porcentaje a las líneas elegidas.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
                <TextField type="month" label="Mes base" value={ipcFrom} onChange={(e) => setIpcFrom(e.target.value)} InputLabelProps={{ shrink: true }} helperText="Desde cuándo se ajusta." />
                <TextField type="month" label="Hasta (opcional)" value={ipcTo} onChange={(e) => setIpcTo(e.target.value)} InputLabelProps={{ shrink: true }} helperText="Vacío = último mes publicado." />
                <Button variant="outlined" onClick={calculateIpc} disabled={!ipcFrom || ipcLoading} sx={{ mt: { sm: 1 } }}>{ipcLoading ? 'Consultando…' : 'Calcular'}</Button>
              </Stack>
              {ipcError && <Alert severity="warning" sx={{ mt: 1.5 }}>{ipcError}</Alert>}
              {ipcResult && (
                <Alert severity="success" sx={{ mt: 1.5 }} action={<Button color="inherit" size="small" onClick={applyIpc} disabled={used.length === 0}>Aplicar a las líneas</Button>}>
                  Variación del IPC de {ipcResult.from.split('-').reverse().join('/')} a {ipcResult.to.split('-').reverse().join('/')}: <strong>{formatPercent(ipcResult.percent)}</strong>
                  {used.length === 0 ? ' (elegí primero las líneas a ajustar)' : ''}
                </Alert>
              )}
            </Box>

            <Typography variant="subtitle1" fontWeight={700}>Qué se ajusta</Typography>
            {lines.length === 0 && <Alert severity="info">Esta factura no tiene líneas de materiales o mano de obra para ajustar.</Alert>}
            {lines.map((line) => (
              <Box key={line.lineId} sx={{ border: 1, borderColor: line.selected ? 'primary.main' : 'divider', borderRadius: 2, p: 2, opacity: line.blocked ? 0.6 : 1 }}>
                <FormControlLabel
                  control={<Checkbox checked={line.selected} disabled={!!line.blocked} onChange={(e) => update(line.lineId, { selected: e.target.checked })} />}
                  label={(
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>{line.label}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Base: {formatMoney(line.base, currency)}{line.blocked ? ` · ${line.blocked}` : ''}
                      </Typography>
                    </Box>
                  )}
                  sx={{ m: 0 }}
                />
                {line.selected && (
                  <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField select label="Índice" value={line.type} onChange={(e) => update(line.lineId, { type: e.target.value as AdjustmentType })} sx={{ minWidth: { sm: 180 } }}>
                        {(Object.keys(ADJUSTMENT_TYPE_LABELS) as AdjustmentType[]).map((t) => <MenuItem key={t} value={t}>{ADJUSTMENT_TYPE_LABELS[t]}</MenuItem>)}
                      </TextField>
                      <TextField
                        label="Porcentaje de ajuste" type="number" value={line.percentText} onChange={(e) => handlePercent(line, e.target.value)}
                        inputProps={{ min: 0, step: 'any', inputMode: 'decimal' }} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                        sx={{ width: { xs: '100%', sm: 170 } }}
                      />
                      <CurrencyInput label="Monto del ajuste (neto)" currency={currency} fullWidth value={line.amount} onChange={(v) => handleAmount(line, v)} />
                    </Stack>
                    <TextField
                      size="small" fullWidth label="Descripción en la factura" value={line.description} inputProps={{ maxLength: 255 }}
                      onChange={(e) => update(line.lineId, { description: e.target.value, descriptionTouched: true })}
                      helperText={line.descriptionTouched
                        ? 'Texto escrito por vos. Si querés volver al estándar, usá «Restaurar texto estándar».'
                        : 'Texto estándar: podés dejarlo así o editarlo. Si cambiás el índice o el período, se actualiza solo.'}
                    />
                    {line.descriptionTouched && (
                      <Box><Button size="small" onClick={() => update(line.lineId, { description: standardDescription(line, period, originalLabel), descriptionTouched: false })}>Restaurar texto estándar</Button></Box>
                    )}
                  </Stack>
                )}
              </Box>
            ))}

            <TextField label="Notas (opcional)" value={notes} fullWidth multiline minRows={2} onChange={(e) => setNotes(e.target.value)} />

            <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
              <Box display="flex" justifyContent="space-between"><Typography variant="body2">Neto del ajuste</Typography><Typography variant="body2">{formatMoney(net, currency)}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography variant="body2">IVA {formatPercent(ivaRate)}</Typography><Typography variant="body2">{formatMoney(iva, currency)}</Typography></Box>
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                <Typography variant="subtitle1" fontWeight={700}>{formatMoney(total, currency)}</Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !original}>{saving ? 'Guardando…' : 'Guardar borrador'}</Button>
      </DialogActions>
    </AppDialog>
  );
}
