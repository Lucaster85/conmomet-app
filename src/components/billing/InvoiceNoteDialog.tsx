'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment,
  MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import AppDialog from '@/components/common/AppDialog';
import CurrencyInput from '../CurrencyInput';
import DateField from '../DateField';
import { Invoice, InvoiceArcaOptions, InvoiceInput, InvoiceKind, InvoiceLineInput, InvoiceService } from '../../utils/api';
import {
  CONCEPT_LABELS, FCE_CBTE_TIPO, formatMoney, formatPercent, formatVoucher, ivaOf, NOTE_KIND_LABELS, roundMoney, roundPercent, todayISO,
} from '../../utils/billing';

interface InvoiceNoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (invoice: Invoice) => void;
  // La factura emitida sobre la que se hace la nota, con `lines[].credited_net` (lo que ya se acreditó).
  original: Invoice | null;
  type: Exclude<InvoiceKind, 'invoice'>;
  // Si viene, se está EDITANDO ese borrador de nota.
  editing?: Invoice | null;
}

interface CreditLine {
  lineId: number;
  concept: 'materials' | 'labor' | 'other';
  originalNet: number;
  // Lo que todavía se puede acreditar de la línea (si se edita un borrador, incluye lo que ese borrador ya reservaba).
  remaining: number;
  percentText: string;
  amount: number | null;
  source: 'percent' | 'amount';
  description: string;
}

interface DebitLine { key: string; description: string; amount: number | null }

const TOLERANCE = 0.01;
let debitCounter = 0;
const newKey = () => `debit-${++debitCounter}`;
const parsePercent = (text: string): number => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function InvoiceNoteDialog({ open, onClose, onSaved, original, type, editing }: InvoiceNoteDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isCredit = type === 'credit_note';
  const currency = original?.currency || 'ARS';
  const ivaRate = Number(original?.iva_rate || 0);
  const isFceOriginal = original?.cbte_tipo === FCE_CBTE_TIPO;

  const [issueDate, setIssueDate] = useState(todayISO());
  const [posId, setPosId] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [annulment, setAnnulment] = useState(false);
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [debitLines, setDebitLines] = useState<DebitLine[]>([]);
  const [options, setOptions] = useState<InvoiceArcaOptions | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !original) return;
    setError('');
    setIssueDate(editing?.issue_date || todayISO());
    setPosId(editing?.point_of_sale_id || original.point_of_sale_id || '');
    setReason(editing?.notes || '');
    setAnnulment(!!editing?.fce_annulment);

    if (isCredit) {
      setCreditLines((original.lines || []).map((line) => {
        const own = editing?.lines.find((l) => l.credits_line_id === line.id);
        const originalNet = Number(line.net_amount);
        const remaining = roundMoney(originalNet - Number(line.credited_net || 0) + Number(own?.net_amount || 0));
        return {
          lineId: line.id as number,
          concept: line.concept,
          originalNet,
          remaining,
          percentText: own ? String(roundPercent((Number(own.net_amount) / originalNet) * 100)) : '',
          amount: own ? Number(own.net_amount) : null,
          source: 'amount' as const,
          description: own?.description || '',
        };
      }));
      setDebitLines([]);
    } else {
      setCreditLines([]);
      setDebitLines(editing && editing.lines.length > 0
        ? editing.lines.map((l) => ({ key: newKey(), description: l.description || '', amount: Number(l.net_amount) }))
        : [{ key: newKey(), description: '', amount: null }]);
    }
    // Solo al abrir: no pisar lo que la persona esté escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, original?.id, editing?.id, type]);

  // Puntos de venta de web service y estado del ambiente.
  useEffect(() => {
    if (!open) return;
    InvoiceService.getArcaOptions().then(setOptions).catch(() => setOptions(null));
  }, [open]);

  const updateCredit = (lineId: number, patch: Partial<CreditLine>) =>
    setCreditLines((prev) => prev.map((l) => (l.lineId === lineId ? { ...l, ...patch } : l)));

  const handlePercent = (line: CreditLine, text: string) => {
    const pct = parsePercent(text);
    updateCredit(line.lineId, { percentText: text, source: 'percent', amount: pct > 0 ? roundMoney((line.originalNet * pct) / 100) : null });
  };
  const handleAmount = (line: CreditLine, value: number | null) =>
    updateCredit(line.lineId, {
      amount: value, source: 'amount',
      percentText: value ? String(roundPercent((value / line.originalNet) * 100)) : '',
    });

  // "Anulación total": cada línea con algo por acreditar, por todo lo que queda.
  const fillTotal = () =>
    setCreditLines((prev) => prev.map((l) => (l.remaining > TOLERANCE
      ? { ...l, amount: l.remaining, source: 'amount' as const, percentText: String(roundPercent((l.remaining / l.originalNet) * 100)) }
      : l)));

  const net = roundMoney(isCredit
    ? creditLines.reduce((acc, l) => acc + (l.amount || 0), 0)
    : debitLines.reduce((acc, l) => acc + (l.amount || 0), 0));
  const iva = ivaOf(net, ivaRate);
  const total = roundMoney(net + iva);

  // ¿La nota acredita todo lo que queda de la factura? Entonces, al emitirla, la factura queda anulada.
  const coversEverything = useMemo(() => {
    if (!isCredit) return false;
    const pending = creditLines.filter((l) => l.remaining > TOLERANCE);
    return pending.length > 0 && pending.every((l) => (l.amount || 0) >= l.remaining - TOLERANCE);
  }, [creditLines, isCredit]);

  const canAnnul = isFceOriginal && original?.fce_acceptance === 'rejected';

  const validate = (): string | null => {
    if (!issueDate) return 'La fecha de la nota es obligatoria.';
    if (original && issueDate < original.issue_date) return 'La fecha de la nota no puede ser anterior a la de la factura.';
    if (!posId) return 'Elegí el punto de venta.';
    if (isCredit) {
      if (!reason.trim()) return 'Indicá el motivo de la nota de crédito.';
      const used = creditLines.filter((l) => (l.amount || 0) > 0);
      if (used.length === 0) return 'Indicá qué se acredita: un porcentaje o un monto de al menos una línea.';
      for (const line of used) {
        if ((line.amount || 0) > line.remaining + TOLERANCE) return `El monto de ${CONCEPT_LABELS[line.concept].toLowerCase()} supera lo que queda por acreditar.`;
      }
    } else {
      const used = debitLines.filter((l) => l.description.trim() || (l.amount || 0) > 0);
      if (used.length === 0) return 'Agregá al menos un concepto a la nota de débito.';
      for (const line of used) {
        if (!line.description.trim()) return 'Cada concepto necesita una descripción.';
        if (!((line.amount || 0) > 0)) return 'Cada concepto necesita un monto mayor a cero.';
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!original) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    const lines: InvoiceLineInput[] = isCredit
      ? creditLines.filter((l) => (l.amount || 0) > 0).map((l) => ({
        credits_line_id: l.lineId,
        ...(l.source === 'percent' && parsePercent(l.percentText) > 0 ? { percent: parsePercent(l.percentText) } : { net_amount: l.amount || 0 }),
        ...(l.description.trim() ? { description: l.description.trim() } : {}),
      }))
      : debitLines.filter((l) => l.description.trim() || (l.amount || 0) > 0).map((l) => ({ description: l.description.trim(), net_amount: l.amount || 0 }));

    const input: InvoiceInput = {
      voucher_type: 'A',
      source: 'arca',
      kind: type,
      associated_invoice_id: original.id,
      issue_date: issueDate,
      currency,
      point_of_sale_id: Number(posId),
      notes: reason.trim() || null,
      lines,
      ...(isFceOriginal ? { fce_annulment: canAnnul && annulment } : {}),
    };

    setSaving(true);
    setError('');
    try {
      const saved = editing ? await InvoiceService.update(editing.id, input) : await InvoiceService.create(input);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  const title = `${editing ? 'Editar borrador de ' : ''}${NOTE_KIND_LABELS[type].toLowerCase()}`;
  const heading = editing ? title.charAt(0).toUpperCase() + title.slice(1) : NOTE_KIND_LABELS[type];

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" fullScreen={isMobile}>
      <DialogTitle>
        {heading}
        {original && (
          <Typography variant="body2" color="text.secondary">
            sobre {formatVoucher(original)}{original.client ? ` · ${original.client.razonSocial}` : ''}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {original && (
          <Stack spacing={2.5}>
            {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

            {isCredit ? (
              <Alert severity="info">
                La nota de crédito <strong>acredita lo que elijas de la factura</strong>. Se guarda como borrador y después se emite en ARCA. Una factura
                emitida no se anula de otra forma: si acreditás <strong>todo</strong>, la factura queda anulada y se libera su saldo en el presupuesto.
              </Alert>
            ) : (
              <Alert severity="info">
                La nota de débito suma un <strong>cargo adicional</strong> a la factura (por ejemplo, intereses o una diferencia de cambio). No cambia el saldo
                del presupuesto. Se guarda como borrador y después se emite en ARCA.
              </Alert>
            )}
            {options && options.env === 'homologacion' && (
              <Alert severity="warning">Ambiente de PRUEBAS de ARCA: la nota que se emita no tiene validez fiscal.</Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateField label="Fecha de la nota *" value={issueDate} onChange={setIssueDate} fullWidth />
              <TextField select label="Punto de venta *" value={posId} fullWidth onChange={(e) => setPosId(Number(e.target.value))}>
                {(options?.points_of_sale || []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{String(p.number).padStart(4, '0')}{p.usage_description ? ` — ${p.usage_description}` : ''}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label={isCredit ? 'Motivo *' : 'Motivo o detalle'} value={reason} fullWidth multiline minRows={2}
              onChange={(e) => setReason(e.target.value)}
              helperText={isCredit ? 'Por ejemplo: "Devolución de materiales" o "Error de facturación". Queda guardado en la nota.' : undefined}
            />

            {isFceOriginal && (
              <Box>
                <FormControlLabel
                  control={<Checkbox checked={annulment && canAnnul} disabled={!canAnnul} onChange={(e) => setAnnulment(e.target.checked)} />}
                  label="Es una anulación: el cliente rechazó la FCE"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  {canAnnul
                    ? 'ARCA solo permite la anulación de una FCE que el cliente rechazó.'
                    : 'Esta opción está disponible cuando registrás que el cliente rechazó la FCE (ícono "Aceptación del cliente" de la factura). Sin eso, la nota se emite sin marca de anulación.'}
                </Typography>
              </Box>
            )}

            <Divider />

            {isCredit ? (
              <>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, minWidth: 160 }}>Qué se acredita</Typography>
                  <Button size="small" variant="outlined" onClick={fillTotal} disabled={creditLines.every((l) => l.remaining <= TOLERANCE)}>
                    Anulación total (todo lo que queda)
                  </Button>
                </Box>
                {creditLines.map((line) => {
                  const done = line.remaining <= TOLERANCE;
                  const pct = parsePercent(line.percentText);
                  return (
                    <Box key={line.lineId} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2, opacity: done ? 0.6 : 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>{CONCEPT_LABELS[line.concept]}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        En la factura: {formatMoney(line.originalNet, currency)} · Queda por acreditar: <strong>{formatMoney(Math.max(line.remaining, 0), currency)}</strong>
                      </Typography>
                      {done ? (
                        <Typography variant="caption" color="text.secondary">Ya está acreditado por completo.</Typography>
                      ) : (
                        <>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
                            <TextField
                              label="Porcentaje de la línea" type="number" value={line.percentText} onChange={(e) => handlePercent(line, e.target.value)}
                              inputProps={{ min: 0, max: 100, step: 'any', inputMode: 'decimal' }}
                              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                              sx={{ width: { xs: '100%', sm: 200 } }}
                            />
                            <CurrencyInput
                              label="Monto a acreditar (neto)" currency={currency} fullWidth value={line.amount} onChange={(v) => handleAmount(line, v)}
                            />
                          </Stack>
                          {pct > 100 && <Typography variant="caption" color="error">Es más de lo que tiene la línea.</Typography>}
                          <TextField
                            label="Descripción (opcional)" value={line.description} fullWidth size="small" sx={{ mt: 1.5 }}
                            onChange={(e) => updateCredit(line.lineId, { description: e.target.value })}
                            helperText="Si la dejás vacía, la nota dice qué se acredita y sobre qué factura."
                          />
                        </>
                      )}
                    </Box>
                  );
                })}
                {coversEverything && (
                  <Alert severity="warning">
                    Esta nota acredita <strong>todo lo que queda</strong> de la factura: al emitirla, la factura va a quedar <strong>anulada</strong> y se libera su saldo en
                    el presupuesto. Si la factura ya se cobró, lo cobrado hay que devolverlo por fuera de la app.
                  </Alert>
                )}
              </>
            ) : (
              <>
                <Typography variant="subtitle1" fontWeight={700}>Conceptos</Typography>
                {debitLines.map((line) => (
                  <Box key={line.key} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
                      <TextField
                        label="Descripción *" fullWidth value={line.description}
                        onChange={(e) => setDebitLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, description: e.target.value } : l)))}
                      />
                      <CurrencyInput
                        label="Monto (neto) *" currency={currency} fullWidth value={line.amount}
                        onChange={(v) => setDebitLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, amount: v } : l)))}
                      />
                      <IconButton
                        size="small" disabled={debitLines.length === 1} aria-label="Quitar concepto"
                        onClick={() => setDebitLines((prev) => prev.filter((l) => l.key !== line.key))}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
                <Box>
                  <Button size="small" onClick={() => setDebitLines((prev) => [...prev, { key: newKey(), description: '', amount: null }])}>+ Agregar concepto</Button>
                </Box>
              </>
            )}

            <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
              <Box display="flex" justifyContent="space-between"><Typography variant="body2">Neto</Typography><Typography variant="body2">{formatMoney(net, currency)}</Typography></Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">IVA {formatPercent(ivaRate)}</Typography>
                <Typography variant="body2">{formatMoney(iva, currency)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="subtitle1" fontWeight={700}>Total de la nota</Typography>
                <Typography variant="subtitle1" fontWeight={700}>{formatMoney(total, currency)}</Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !original}>
          {saving ? 'Guardando…' : 'Guardar borrador'}
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
