'use client';
import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import ClientBanner from './ClientBanner';
import FeedbackModal from '../FeedbackModal';
import CurrencyInput from '../CurrencyInput';
import DateField from '../DateField';
import { Invoice, InvoiceArcaOptions, InvoiceInput, InvoiceService } from '../../utils/api';
import { formatDate, formatMoney, formatPercent, formatVoucher, ivaOf, roundMoney, todayISO, rateToInput, sanitizeRateInput, roundRate, formatRate} from '../../utils/billing';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (invoice: Invoice) => void;
  // La factura en dólares emitida, con `lines[].credited_net` (lo ya acreditado, que se resta de la base).
  original: Invoice | null;
  // Si viene, se está EDITANDO ese borrador de nota.
  editing?: Invoice | null;
}

const toNumber = (text: string): number => {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// Nota por diferencia de cambio (FLOWS.md §73): si el dólar subió desde la factura, una nota de DÉBITO en pesos por la diferencia; si bajó, una de CRÉDITO.
// Bunge las pide para las facturas en dólares. El tipo lo decide el signo de la diferencia; se guarda como borrador y se emite por ARCA.
export default function ExchangeDifferenceDialog({ open, onClose, onSaved, original, editing }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const baseRate = Number(original?.exchange_rate || 0);
  const ivaRate = Number(original?.iva_rate || 0);
  // Lo que queda de la factura (neto en dólares) después de las notas de crédito comunes.
  const remainingUsd = original ? roundMoney(Number(original.net_amount) - (original.lines || []).reduce((acc, l) => acc + Number(l.credited_net || 0), 0)) : 0;

  const [issueDate, setIssueDate] = useState(todayISO());
  const [posId, setPosId] = useState<number | ''>('');
  const [newRate, setNewRate] = useState('');
  const [baseUsd, setBaseUsd] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [options, setOptions] = useState<InvoiceArcaOptions | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !original) return;
    setError('');
    setIssueDate(editing?.issue_date || todayISO());
    setPosId(editing?.point_of_sale_id || original.point_of_sale_id || '');
    setNewRate(editing?.exchange_diff_new_rate ? rateToInput(editing.exchange_diff_new_rate) : '');
    setBaseUsd(editing?.exchange_diff_base_usd ?? remainingUsd);
    setNotes(editing?.notes || '');
    // Solo al abrir: no pisar lo que la persona esté escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, original?.id, editing?.id]);

  useEffect(() => {
    if (!open) return;
    InvoiceService.getArcaOptions().then(setOptions).catch(() => setOptions(null));
  }, [open]);

  const loadArcaRate = async () => {
    setRateLoading(true);
    setError('');
    try {
      setNewRate(rateToInput((await InvoiceService.getArcaExchangeRate()).rate));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo traer la cotización de ARCA');
    } finally {
      setRateLoading(false);
    }
  };

  const rate = roundRate(toNumber(newRate));
  const difference = rate > 0 ? Math.round((rate - baseRate) * 100) / 100 : 0;
  const isDebit = difference > 0;
  const net = roundMoney((baseUsd || 0) * Math.abs(difference));
  const iva = ivaOf(net, ivaRate);
  const total = roundMoney(net + iva);

  const validate = (): string | null => {
    if (!issueDate) return 'La fecha de la nota es obligatoria.';
    if (original && issueDate < original.issue_date) return 'La fecha de la nota no puede ser anterior a la de la factura.';
    if (!posId) return 'Elegí el punto de venta.';
    if (!(rate > 0)) return 'Indicá la cotización nueva (la del día de cobro).';
    if (difference === 0) return 'La cotización nueva es igual a la de la factura: no hay diferencia de cambio para facturar.';
    if (!((baseUsd || 0) > 0)) return 'Indicá el neto en dólares sobre el que se calcula.';
    if ((baseUsd || 0) > remainingUsd + 0.01) return `El neto en dólares no puede superar lo que queda de la factura (${formatMoney(remainingUsd, 'USD')}).`;
    return null;
  };

  const handleSubmit = async () => {
    if (!original) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    const input: InvoiceInput = {
      voucher_type: 'A',
      source: 'arca',
      exchange_difference: true,
      associated_invoice_id: original.id,
      issue_date: issueDate,
      currency: 'ARS',
      point_of_sale_id: Number(posId),
      new_exchange_rate: rate,
      base_usd: baseUsd as number,
      notes: notes.trim() || null,
      lines: [],
    };
    setSaving(true);
    setError('');
    try {
      onSaved(editing ? await InvoiceService.update(editing.id, input) : await InvoiceService.create(input));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>
        {editing ? 'Editar nota por diferencia de cambio' : 'Diferencia de cambio'}
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
              Si el dólar <strong>subió</strong> desde la factura, se emite una <strong>nota de débito en pesos</strong> por la diferencia; si <strong>bajó</strong>, una <strong>nota de crédito</strong>.
              Se guarda como borrador y se emite en ARCA. No cambia el saldo del presupuesto.
            </Alert>
            {options && options.env === 'homologacion' && <Alert severity="warning">Ambiente de PRUEBAS de ARCA: la nota que se emita no tiene validez fiscal.</Alert>}

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              <TextField label="Cotización de la factura" value={baseRate ? formatRate(baseRate) : '—'} disabled helperText={`Neto de la factura: ${formatMoney(Number(original.net_amount), 'USD')}`} />
              <TextField
                label="Cotización nueva (día de cobro) *" value={newRate} onChange={(e) => setNewRate(sanitizeRateInput(e.target.value))} inputProps={{ inputMode: 'decimal' }}
                InputProps={{ endAdornment: <InputAdornment position="end"><Button size="small" onClick={loadArcaRate} disabled={rateLoading}>{rateLoading ? '…' : 'Traer de ARCA'}</Button></InputAdornment> }}
                helperText="La del día en que se cobró (por ejemplo, la de ARCA o la del banco)."
              />
              <CurrencyInput label="Neto en dólares sobre el que se calcula *" currency="USD" fullWidth value={baseUsd} onChange={setBaseUsd} />
              <Box display="flex" alignItems="center">
                <Typography variant="caption" color="text.secondary">Por defecto, lo que queda de la factura: {formatMoney(remainingUsd, 'USD')}. Bajalo si solo se cobró una parte.</Typography>
              </Box>
              <DateField label="Fecha de la nota *" value={issueDate} onChange={setIssueDate} fullWidth />
              <TextField select label="Punto de venta *" value={posId} fullWidth onChange={(e) => setPosId(Number(e.target.value))}>
                {(options?.points_of_sale || []).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{String(p.number).padStart(4, '0')}{p.usage_description ? ` — ${p.usage_description}` : ''}</MenuItem>
                ))}
              </TextField>
            </Box>
            <TextField label="Notas (opcional)" value={notes} fullWidth multiline minRows={2} onChange={(e) => setNotes(e.target.value)} />

            <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
              {difference === 0 ? (
                <Typography variant="body2" color="text.secondary">Ingresá la cotización nueva para ver la nota que se genera.</Typography>
              ) : (
                <>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {isDebit ? 'Nota de débito' : 'Nota de crédito'} en pesos · diferencia de {formatMoney(Math.abs(difference), 'ARS')} por dólar
                  </Typography>
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">Neto</Typography><Typography variant="body2">{formatMoney(net, 'ARS')}</Typography></Box>
                  <Box display="flex" justifyContent="space-between"><Typography variant="body2">IVA {formatPercent(ivaRate)}</Typography><Typography variant="body2">{formatMoney(iva, 'ARS')}</Typography></Box>
                  <Box display="flex" justifyContent="space-between" mt={0.5}>
                    <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>{formatMoney(total, 'ARS')}</Typography>
                  </Box>
                </>
              )}
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
