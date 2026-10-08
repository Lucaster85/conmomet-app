'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import DateField from '../DateField';
import { Invoice, InvoiceService } from '../../utils/api';
import { formatMoney, formatVoucher, todayISO } from '../../utils/billing';

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
    <Dialog open={!!invoice} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
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
    </Dialog>
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
    <Dialog open={!!invoice} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
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
    </Dialog>
  );
}
