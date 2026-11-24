'use client';
import React, { useEffect, useState } from 'react';
import { Box, Button, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../FeedbackModal';
import DateField from '../DateField';
import { BillingDocsService, BudgetCurrency, PurchaseOrder, SuretyBond, SuretyBondPurpose } from '../../utils/api';
import { BILLING_FILE_ACCEPT, BOND_PURPOSE_LABELS, validateBillingFiles } from '../../utils/billing';

interface Props {
  open: boolean;
  onClose: () => void;
  budgetId: number;
  budgetCurrency: BudgetCurrency;
  // Vigentes del presupuesto, para asociar la póliza a una OC (opcional).
  orders: PurchaseOrder[];
  bond: SuretyBond | null;
  onSaved: (message: string, warnings: string[]) => void;
}

// Alta y edición de un seguro de caución (FLOWS.md §69). Sin vencimiento no hay avisos (algunos clientes piden pólizas sin fecha).
export default function SuretyBondDialog({ open, onClose, budgetId, budgetCurrency, orders, bond, onSaved }: Props) {
  const [insurer, setInsurer] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<BudgetCurrency>(budgetCurrency);
  const [purpose, setPurpose] = useState<SuretyBondPurpose>('advance_payment');
  const [issueDate, setIssueDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notifyDays, setNotifyDays] = useState('30');
  const [orderId, setOrderId] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setInsurer(bond?.insurer ?? '');
    setPolicyNumber(bond?.policy_number ?? '');
    setAmount(bond ? String(bond.amount) : '');
    setCurrency(bond?.currency ?? budgetCurrency);
    setPurpose(bond?.purpose ?? 'advance_payment');
    setIssueDate(bond?.issue_date ?? '');
    setExpirationDate(bond?.expiration_date ?? '');
    setNotifyDays(String(bond?.notify_days_before ?? 30));
    setOrderId(bond?.purchase_order_id ? String(bond.purchase_order_id) : '');
    setNotes(bond?.notes ?? '');
    setFile(null);
    setError('');
  }, [open, bond, budgetCurrency]);

  const handleSave = async () => {
    if (!insurer.trim()) { setError('Indicá la aseguradora.'); return; }
    if (!policyNumber.trim()) { setError('Indicá el número de póliza.'); return; }
    const amountNumber = Number(amount.trim().replace(',', '.'));
    if (!(amountNumber > 0)) { setError('El monto de la caución tiene que ser mayor a cero.'); return; }
    if (issueDate && expirationDate && expirationDate < issueDate) { setError('El vencimiento no puede ser anterior a la emisión.'); return; }
    const days = Number(notifyDays);
    if (!Number.isInteger(days) || days < 0 || days > 365) { setError('Los días de aviso tienen que estar entre 0 y 365.'); return; }
    const fileError = validateBillingFiles(file ? [file] : []);
    if (fileError) { setError(fileError); return; }

    const input = {
      budget_id: budgetId,
      purchase_order_id: orderId ? Number(orderId) : null,
      insurer: insurer.trim(),
      policy_number: policyNumber.trim(),
      amount: amountNumber,
      currency,
      issue_date: issueDate || null,
      purpose,
      expiration_date: expirationDate || null,
      notify_days_before: days,
      notes: notes.trim(),
      file,
    };
    setSaving(true);
    setError('');
    try {
      const { warnings } = bond ? await BillingDocsService.updateBond(bond.id, input) : await BillingDocsService.createBond(input);
      onSaved(bond ? 'Caución actualizada' : 'Caución cargada', warnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la caución');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{bond ? 'Editar seguro de caución' : 'Cargar seguro de caución'}</DialogTitle>
      <DialogContent>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <TextField label="Aseguradora *" value={insurer} onChange={(e) => setInsurer(e.target.value)} inputProps={{ maxLength: 150 }} fullWidth />
            <TextField label="N° de póliza *" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} inputProps={{ maxLength: 80 }} fullWidth />
            <Box display="grid" gridTemplateColumns="110px 1fr" gap={1}>
              <TextField select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value as BudgetCurrency)}>
                <MenuItem value="ARS">ARS</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
              <TextField label="Monto *" value={amount} onChange={(e) => setAmount(e.target.value)} inputProps={{ inputMode: 'decimal' }} />
            </Box>
            <TextField select label="Motivo" value={purpose} onChange={(e) => setPurpose(e.target.value as SuretyBondPurpose)} fullWidth>
              {Object.entries(BOND_PURPOSE_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <DateField label="Fecha de emisión" value={issueDate} onChange={setIssueDate} fullWidth />
            <DateField label="Vencimiento" value={expirationDate} onChange={setExpirationDate} fullWidth />
          </Box>
          <TextField
            label="Avisar con anticipación (días)" value={notifyDays} onChange={(e) => setNotifyDays(e.target.value)} inputProps={{ inputMode: 'numeric' }}
            helperText={expirationDate ? 'Se avisa a quienes ven Facturación cuando falta este plazo y de nuevo al vencer.' : 'Sin vencimiento no hay avisos.'} fullWidth
          />
          <TextField select label="OC asociada (opcional)" value={orderId} onChange={(e) => setOrderId(e.target.value)} fullWidth>
            <MenuItem value="">Sin OC asociada</MenuItem>
            {orders.map((o) => <MenuItem key={o.id} value={String(o.id)}>OC {o.number}</MenuItem>)}
          </TextField>
          <TextField label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} fullWidth multiline minRows={2} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              Póliza (PDF o imagen){bond?.file_name ? `. Ya hay un archivo cargado (${bond.file_name}): si elegís otro, lo reemplaza.` : ''}
            </Typography>
            <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ mt: 1 }}>
              {file ? file.name : 'Adjuntar póliza'}
              <input hidden type="file" accept={BILLING_FILE_ACCEPT} onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
      </DialogActions>
    </AppDialog>
  );
}
