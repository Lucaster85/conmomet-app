'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import DateField from '../DateField';
import { Invoice, InvoiceArcaOptions, InvoiceService } from '../../utils/api';
import { ARCA_CONCEPT_LABELS, formatDate, formatMoney, formatVoucher, todayISO } from '../../utils/billing';
import { formatCuit } from '../../utils/cuit';

interface ActionDialogProps {
  invoice: Invoice | null;
  onClose: () => void;
  onDone: (invoice: Invoice) => void;
}

// "Marcar cobrada": pide la fecha de cobro. No hay cobros parciales en esta versión.
export function PayInvoiceDialog({ invoice, onClose, onDone }: ActionDialogProps) {
  const [paidAt, setPaidAt] = useState(todayISO());
  const [receipt, setReceipt] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) { setPaidAt(todayISO()); setReceipt(null); setError(''); }
  }, [invoice]);

  const handleConfirm = async () => {
    if (!invoice) return;
    if (!paidAt) { setError('Indicá la fecha de cobro.'); return; }
    setSaving(true);
    setError('');
    try {
      onDone(await InvoiceService.pay(invoice.id, paidAt, receipt));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar la factura como cobrada');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={!!invoice} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Marcar como cobrada</DialogTitle>
      <DialogContent>
        {invoice && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {formatVoucher(invoice)} · {formatMoney(invoice.total_amount, invoice.currency)}
          </Typography>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DateField label="Fecha de cobro *" value={paidAt} onChange={setPaidAt} fullWidth />
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Comprobante de pago (opcional): transferencia, recibo, etc.
          </Typography>
          <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ mt: 1 }}>
            {receipt ? receipt.name : 'Adjuntar comprobante'}
            <input hidden type="file" accept="application/pdf,image/*" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={saving}>{saving ? 'Guardando…' : 'Marcar cobrada'}</Button>
      </DialogActions>
    </AppDialog>
  );
}

// "Anular": motivo obligatorio. Libera el saldo del presupuesto. Es para cuando la factura real se
// anuló; si solo se cargó mal un dato, se corrige (Editar) en vez de anular.
export function CancelInvoiceDialog({ invoice, onClose, onDone }: ActionDialogProps) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) { setReason(''); setError(''); }
  }, [invoice]);

  const handleConfirm = async () => {
    if (!invoice) return;
    if (!reason.trim()) { setError('El motivo de la anulación es obligatorio.'); return; }
    setSaving(true);
    setError('');
    try {
      onDone(await InvoiceService.cancel(invoice.id, reason.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular la factura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={!!invoice} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Anular factura</DialogTitle>
      <DialogContent>
        {invoice && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{formatVoucher(invoice)}</strong> · {formatMoney(invoice.total_amount, invoice.currency)}
          </Typography>
        )}
        <Alert severity="info" sx={{ mb: 2 }}>
          Anular libera el saldo del presupuesto para volver a facturarlo. Usalo cuando la factura
          real se anuló; si solo cargaste mal un dato (por ejemplo el número), corregila con
          “Editar” en vez de anularla.
        </Alert>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Motivo de la anulación *" fullWidth multiline minRows={2}
          value={reason} onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Volver</Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={saving}>{saving ? 'Anulando…' : 'Anular factura'}</Button>
      </DialogActions>
    </AppDialog>
  );
}


interface ArcaActionDialogProps extends ActionDialogProps {
  // Recarga el listado: una emisión que falla puede dejar la factura en otro estado (rechazada / autorizando).
  onRefresh?: () => void;
}

// "Emitir en ARCA": confirmación con lo que se va a mandar (ambiente, punto de venta, tipo, cliente y total), porque emitir
// es IRREVERSIBLE (PLAN_ARCA.md §8, S3).
export function EmitInvoiceDialog({ invoice, onClose, onDone, onRefresh }: ArcaActionDialogProps) {
  const [options, setOptions] = useState<InvoiceArcaOptions | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!invoice) return;
    setError('');
    setOptions(null);
    InvoiceService.getArcaOptions().then(setOptions).catch((err) => setError(err instanceof Error ? err.message : 'Error al consultar ARCA'));
  }, [invoice]);

  const handleConfirm = async () => {
    if (!invoice || sending) return;
    setSending(true);
    setError('');
    try {
      onDone(await InvoiceService.emit(invoice.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al emitir la factura en ARCA');
      onRefresh?.();
    } finally {
      setSending(false);
    }
  };

  const isProduction = options?.env === 'produccion';
  const row = (label: string, value: React.ReactNode) => (
    <Box display="flex" justifyContent="space-between" gap={2}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" textAlign="right">{value}</Typography>
    </Box>
  );
  const pos = invoice?.pointOfSale;

  return (
    <AppDialog open={!!invoice} onClose={sending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Emitir en ARCA</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {options && !options.enabled && (
          <Alert severity="warning" sx={{ mb: 2 }}>{options.config_error || 'La integración con ARCA está apagada en este servidor.'}</Alert>
        )}
        {invoice && (
          <Stack spacing={1}>
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">Ambiente:</Typography>
              {options?.env ? (
                <Chip size="small" color={isProduction ? 'error' : 'warning'} sx={{ fontWeight: 700 }}
                  label={isProduction ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN (pruebas)'} />
              ) : <Typography variant="body2">…</Typography>}
            </Box>
            {row('Tipo de comprobante', 'Factura A')}
            {row('Punto de venta', pos ? `${String(pos.number).padStart(4, '0')}${pos.usage_description ? ` — ${pos.usage_description}` : ''}` : String(invoice.pos_number ?? '—').padStart(4, '0'))}
            {row('Cliente', `${invoice.client?.razonSocial || '—'}${invoice.recipient_doc_number ? ` · CUIT ${formatCuit(invoice.recipient_doc_number)}` : ''}`)}
            {invoice.arca_concept && row('Concepto', ARCA_CONCEPT_LABELS[invoice.arca_concept])}
            {row('Fecha de emisión', formatDate(invoice.issue_date))}
            {row('Neto', formatMoney(invoice.net_amount, invoice.currency))}
            {row(`IVA ${invoice.iva_rate}%`, formatMoney(invoice.iva_amount, invoice.currency))}
            {row('Total', <strong>{formatMoney(invoice.total_amount, invoice.currency)}</strong>)}
            {invoice.currency === 'USD' && invoice.total_amount_ars != null && row(
              `Total en pesos (cotización ${invoice.exchange_rate})`, formatMoney(invoice.total_amount_ars, 'ARS')
            )}
          </Stack>
        )}
        <Alert severity={isProduction ? 'warning' : 'info'} sx={{ mt: 2 }}>
          {isProduction
            ? 'Es una factura REAL. '
            : 'Es el ambiente de pruebas: la factura no tiene validez fiscal. '}
          Al emitir, ARCA le asigna el número y el CAE, y la factura <strong>ya no se puede editar ni anular</strong>: si hay un error,
          se corrige con una nota de crédito.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>Cancelar</Button>
        <Button variant="contained" color={isProduction ? 'error' : 'primary'} onClick={handleConfirm} disabled={sending || !options || !options.enabled}>
          {sending ? 'Emitiendo…' : 'Emitir en ARCA'}
        </Button>
      </DialogActions>
    </AppDialog>
  );
}

// "Verificar en ARCA": para una factura que quedó "autorizando" (ARCA no respondió). Consulta el comprobante: si existe, la
// completa; si no, vuelve a borrador. Nunca se reintenta a ciegas, para no duplicar.
export function VerifyInvoiceDialog({ invoice, onClose, onDone, onRefresh }: ArcaActionDialogProps) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<'authorized' | 'back_to_draft' | null>(null);

  useEffect(() => {
    if (invoice) { setError(''); setResult(null); }
  }, [invoice]);

  const handleConfirm = async () => {
    if (!invoice || checking) return;
    setChecking(true);
    setError('');
    try {
      const { invoice: updated, outcome } = await InvoiceService.verify(invoice.id);
      setResult(outcome);
      onRefresh?.();
      if (outcome === 'authorized') onDone(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar la factura en ARCA');
    } finally {
      setChecking(false);
    }
  };

  return (
    <AppDialog open={!!invoice} onClose={checking ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Verificar en ARCA</DialogTitle>
      <DialogContent>
        {invoice && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{formatVoucher(invoice)}</strong> · {formatMoney(invoice.total_amount, invoice.currency)}
          </Typography>
        )}
        {!result && (
          <Alert severity="info" sx={{ mb: 2 }}>
            ARCA no confirmó esta emisión (no respondió a tiempo). Se va a consultar ARCA: si el comprobante existe, la factura se completa
            con su CAE; si no existe, vuelve a borrador y podés emitirla de nuevo. <strong>No la emitas otra vez antes de verificar.</strong>
          </Alert>
        )}
        {result === 'back_to_draft' && (
          <Alert severity="success" sx={{ mb: 2 }}>ARCA no tiene ese comprobante: la factura volvió a borrador. Ya podés emitirla de nuevo.</Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={checking}>{result ? 'Cerrar' : 'Cancelar'}</Button>
        {!result && <Button variant="contained" onClick={handleConfirm} disabled={checking}>{checking ? 'Consultando…' : 'Verificar en ARCA'}</Button>}
      </DialogActions>
    </AppDialog>
  );
}

// "Descartar": un borrador o una factura rechazada por ARCA nunca tuvieron CAE, así que se descartan sin nota de crédito y liberan el saldo.
export function DiscardInvoiceDialog({ invoice, onClose, onDone }: ActionDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) setError('');
  }, [invoice]);

  const handleConfirm = async () => {
    if (!invoice) return;
    setSaving(true);
    setError('');
    try {
      onDone(await InvoiceService.discard(invoice.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descartar la factura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={!!invoice} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Descartar factura</DialogTitle>
      <DialogContent>
        {invoice && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{formatVoucher(invoice)}</strong> · {formatMoney(invoice.total_amount, invoice.currency)}
          </Typography>
        )}
        <Alert severity="info" sx={{ mb: error ? 2 : 0 }}>
          Esta factura nunca se emitió en ARCA, así que se descarta sin nota de crédito y <strong>libera el saldo</strong> del presupuesto
          para volver a facturarlo.
        </Alert>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Volver</Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={saving}>{saving ? 'Descartando…' : 'Descartar'}</Button>
      </DialogActions>
    </AppDialog>
  );
}
