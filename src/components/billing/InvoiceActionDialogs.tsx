'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup, Stack, TextField, Typography } from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../FeedbackModal';
import { UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import DateField from '../DateField';
import { Invoice, InvoiceArcaOptions, InvoiceService } from '../../utils/api';
import {
  ARCA_CONCEPT_LABELS, cbteLongName, FCE_ACCEPTANCE_LABELS, FCE_CBTE_TIPO, FCE_TRANSFER_LABELS, formatAssociated, formatDate, formatMoney, formatVoucher, isNote, todayISO, formatRate} from '../../utils/billing';
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
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
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
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
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
  // Vista previa: el PDF del borrador con el formato de la factura final (sin número, CAE ni QR). Si no se puede generar, se cae al resumen de datos.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    if (!invoice) return;
    setError('');
    setOptions(null);
    InvoiceService.getArcaOptions().then(setOptions).catch((err) => setError(err instanceof Error ? err.message : 'Error al consultar ARCA'));
  }, [invoice]);

  useEffect(() => {
    if (!invoice) return;
    let cancelled = false;
    let url: string | null = null;
    setPreviewUrl(null);
    setPreviewError('');
    setPreviewLoading(true);
    InvoiceService.previewPdf(invoice.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch((err) => { if (!cancelled) setPreviewError(err instanceof Error ? err.message : 'Error al generar la vista previa'); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
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
    <AppDialog open={!!invoice} onClose={sending ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>Vista previa de la factura</DialogTitle>
      <DialogContent>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
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
              <Typography variant="caption" color="text.secondary">
                BORRADOR de Factura
              </Typography>
            </Box>

            {previewLoading && (
              <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} sx={{ height: '60vh' }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">Armando la vista previa…</Typography>
              </Box>
            )}

            {previewUrl && (
              <Box
                component="iframe"
                title="Vista previa de la factura"
                src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                sx={{ width: '100%', height: '65vh', minHeight: 420, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#f5f5f5' }}
              />
            )}

            {/* Respaldo: si la vista previa no se pudo generar, el resumen de datos de siempre (se puede emitir igual). */}
            {previewError && !previewLoading && (
              <>
                <Alert severity="warning">No se pudo generar la vista previa ({previewError}). Revisá este resumen antes de emitir.</Alert>
                {row('Tipo de comprobante', cbteLongName(invoice.cbte_tipo))}
                {isNote(invoice) && row('Sobre la factura', formatAssociated(invoice))}
                {invoice.kind === 'credit_note' && invoice.notes && row('Motivo', invoice.notes)}
                {row('Punto de venta', pos ? `${String(pos.number).padStart(4, '0')}${pos.usage_description ? ` — ${pos.usage_description}` : ''}` : String(invoice.pos_number ?? '—').padStart(4, '0'))}
                {row('Cliente', `${invoice.client?.razonSocial || '—'}${invoice.recipient_doc_number ? ` · CUIT ${formatCuit(invoice.recipient_doc_number)}` : ''}`)}
                {invoice.arca_concept && row('Concepto', ARCA_CONCEPT_LABELS[invoice.arca_concept])}
                {row('Fecha de emisión', formatDate(invoice.issue_date))}
                {invoice.cbte_tipo === FCE_CBTE_TIPO && (
                  <>
                    {row('Vencimiento de pago', formatDate(invoice.due_date))}
                    {row('Cuenta del emisor', invoice.bankAccount ? `${invoice.bankAccount.bank_name} · CBU ${invoice.bankAccount.cbu}${invoice.bankAccount.alias ? ` · ${invoice.bankAccount.alias}` : ''}` : '—')}
                    {row('Opción de transferencia', invoice.fce_transfer_option ? FCE_TRANSFER_LABELS[invoice.fce_transfer_option] : '—')}
                    {invoice.commercial_reference && row('Referencia comercial', invoice.commercial_reference)}
                  </>
                )}
                {row('Neto', formatMoney(invoice.net_amount, invoice.currency))}
                {row(`IVA ${invoice.iva_rate}%`, formatMoney(invoice.iva_amount, invoice.currency))}
                {row('Total', <strong>{formatMoney(invoice.total_amount, invoice.currency)}</strong>)}
                {invoice.currency === 'USD' && invoice.total_amount_ars != null && row(
                  `Total en pesos (cotización ${formatRate(invoice.exchange_rate)})`, formatMoney(invoice.total_amount_ars, 'ARS')
                )}
              </>
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
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
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
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Volver</Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={saving}>{saving ? 'Descartando…' : 'Descartar'}</Button>
      </DialogActions>
    </AppDialog>
  );
}

// Aceptación de una FCE por el cliente. Se carga A MANO: el cliente la acepta o rechaza en ARCA y acá solo se deja registrado
// (consultarlo automáticamente es una etapa futura). Una FCE "aceptada" o "rechazada" no cambia nada más en la factura.
export function FceAcceptanceDialog({ invoice, onClose, onDone }: ActionDialogProps) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) { setStatus(invoice.fce_acceptance || 'pending'); setError(''); }
  }, [invoice]);

  const handleConfirm = async () => {
    if (!invoice) return;
    setSaving(true);
    setError('');
    try {
      onDone(await InvoiceService.setFceAcceptance(invoice.id, status));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la aceptación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={!!invoice} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Aceptación de la FCE</DialogTitle>
      <DialogContent>
        {invoice && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{formatVoucher(invoice)}</strong> · {formatMoney(invoice.total_amount, invoice.currency)}
          </Typography>
        )}
        <Alert severity="info" sx={{ mb: 2 }}>
          El cliente acepta o rechaza la FCE en ARCA (si no responde en 21 días corridos se considera aceptada). Acá se deja registrado
          lo que pasó, a mano.
        </Alert>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        <RadioGroup value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          {(Object.keys(FCE_ACCEPTANCE_LABELS) as Array<keyof typeof FCE_ACCEPTANCE_LABELS>).map((key) => (
            <FormControlLabel key={key} value={key} control={<Radio />} label={FCE_ACCEPTANCE_LABELS[key].label} />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </DialogActions>
    </AppDialog>
  );
}
