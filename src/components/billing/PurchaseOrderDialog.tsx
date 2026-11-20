'use client';
import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { AddOutlined as AddIcon, DeleteOutline as DeleteIcon, UploadFileOutlined as UploadIcon } from '@mui/icons-material';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../FeedbackModal';
import DateField from '../DateField';
import {
  BudgetCurrency, PurchaseOrder, PurchaseOrderAdjustmentType, PurchaseOrderConcept, PurchaseOrderInput, BillingDocsService,
} from '../../utils/api';
import { BILLING_FILE_ACCEPT, PO_ADJUSTMENT_LABELS, PO_CONCEPT_LABELS, todayISO, validateBillingFiles } from '../../utils/billing';

export type PurchaseOrderDialogMode =
  | { kind: 'create' }
  | { kind: 'edit'; order: PurchaseOrder }
  | { kind: 'replace'; order: PurchaseOrder };

interface Props {
  open: boolean;
  onClose: () => void;
  budgetId: number;
  budgetCurrency: BudgetCurrency;
  mode: PurchaseOrderDialogMode;
  onSaved: (message: string, warnings: string[]) => void;
}

interface ItemRow { position: string; description: string; amount: string }

const TITLES = { create: 'Cargar OC del cliente', edit: 'Editar OC', replace: 'Reemplazar OC' } as const;

// Alta, edición y reemplazo de una OC del cliente (FLOWS.md §69). Todo es opcional salvo número y fecha: una OC sin monto es solo de referencia.
export default function PurchaseOrderDialog({ open, onClose, budgetId, budgetCurrency, mode, onSaved }: Props) {
  const source = mode.kind === 'create' ? null : mode.order;
  const [number, setNumber] = useState('');
  const [date, setDate] = useState(todayISO());
  const [concept, setConcept] = useState<PurchaseOrderConcept>('all');
  const [currency, setCurrency] = useState<BudgetCurrency>(budgetCurrency);
  const [amount, setAmount] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [allowsAdjustment, setAllowsAdjustment] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<PurchaseOrderAdjustmentType>('ipc_indec');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setNumber(source?.number ?? '');
    setDate(source?.date ?? todayISO());
    setConcept(source?.concept ?? 'all');
    setCurrency(source?.currency ?? budgetCurrency);
    setAmount(source?.amount != null ? String(source.amount) : '');
    setPaymentTerms(source?.payment_terms ?? '');
    setAllowsAdjustment(source?.allows_adjustment ?? false);
    setAdjustmentType(source?.adjustment_type ?? 'ipc_indec');
    setAdjustmentNotes(source?.adjustment_notes ?? '');
    setItems((source?.items ?? []).map((i) => ({ position: i.position ?? '', description: i.description, amount: i.amount != null ? String(i.amount) : '' })));
    setFiles([]);
    setReason('');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode.kind, source?.id]);

  const updateItem = (index: number, patch: Partial<ItemRow>) => setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    if (!number.trim()) { setError('Indicá el número de OC.'); return; }
    if (!date) { setError('Indicá la fecha de la OC.'); return; }
    if (mode.kind === 'replace' && !reason.trim()) { setError('Indicá el motivo del reemplazo.'); return; }
    const amountText = amount.trim().replace(',', '.');
    if (amountText && !(Number(amountText) > 0)) { setError('El monto tiene que ser mayor a cero (o dejalo vacío si la OC es solo de referencia).'); return; }
    if (items.some((i) => !i.description.trim())) { setError('Cada posición necesita una descripción.'); return; }
    const filesError = validateBillingFiles(files);
    if (filesError) { setError(filesError); return; }

    const input: PurchaseOrderInput = {
      budget_id: budgetId,
      number: number.trim(),
      date,
      concept,
      currency,
      amount: amountText ? Number(amountText) : null,
      payment_terms: paymentTerms.trim(),
      allows_adjustment: allowsAdjustment,
      adjustment_type: adjustmentType,
      adjustment_notes: allowsAdjustment ? adjustmentNotes.trim() : '',
      items: items.map((i) => ({
        position: i.position.trim() || null,
        description: i.description.trim(),
        amount: i.amount.trim() ? Number(i.amount.replace(',', '.')) : null,
      })),
      reason: reason.trim(),
      files,
    };

    setSaving(true);
    setError('');
    try {
      if (mode.kind === 'edit') {
        await BillingDocsService.updateOrder(mode.order.id, input);
        onSaved('OC actualizada', []);
      } else if (mode.kind === 'replace') {
        const { warnings } = await BillingDocsService.replaceOrder(mode.order.id, input);
        onSaved('OC reemplazada: la anterior quedó guardada con su motivo', warnings);
      } else {
        const { warnings } = await BillingDocsService.createOrder(input);
        onSaved('OC cargada', warnings);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la OC');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{TITLES[mode.kind]}</DialogTitle>
      <DialogContent>
        <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
        {mode.kind === 'replace' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            La OC {mode.order.number} queda guardada como reemplazada, con el motivo que indiques. Los datos de abajo son los de la OC nueva.
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          {mode.kind === 'replace' && (
            <TextField label="Motivo del reemplazo *" value={reason} onChange={(e) => setReason(e.target.value)} fullWidth multiline minRows={2} />
          )}
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
            <TextField label="Número de OC *" value={number} onChange={(e) => setNumber(e.target.value)} inputProps={{ maxLength: 60 }} fullWidth />
            <DateField label="Fecha de la OC *" value={date} onChange={setDate} fullWidth />
            <TextField select label="Concepto" value={concept} onChange={(e) => setConcept(e.target.value as PurchaseOrderConcept)} fullWidth>
              {Object.entries(PO_CONCEPT_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
            </TextField>
            <Box display="grid" gridTemplateColumns="110px 1fr" gap={1}>
              <TextField select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value as BudgetCurrency)}>
                <MenuItem value="ARS">ARS</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
              <TextField label="Monto (opcional)" value={amount} onChange={(e) => setAmount(e.target.value)} inputProps={{ inputMode: 'decimal' }} helperText="Vacío = OC solo de referencia" />
            </Box>
          </Box>
          <TextField label="Condiciones de pago (opcional)" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} fullWidth multiline minRows={2} />

          <Box>
            <FormControlLabel control={<Switch checked={allowsAdjustment} onChange={(e) => setAllowsAdjustment(e.target.checked)} />} label="La OC admite ajuste de precios" />
            {allowsAdjustment && (
              <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '220px 1fr' }} gap={2} mt={1}>
                <TextField select label="Índice de ajuste" value={adjustmentType} onChange={(e) => setAdjustmentType(e.target.value as PurchaseOrderAdjustmentType)}>
                  {Object.entries(PO_ADJUSTMENT_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
                </TextField>
                <TextField label="Notas del ajuste (opcional)" value={adjustmentNotes} onChange={(e) => setAdjustmentNotes(e.target.value)} fullWidth />
              </Box>
            )}
          </Box>

          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={700}>Posiciones (opcional)</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setItems((prev) => [...prev, { position: '', description: '', amount: '' }])}>Agregar posición</Button>
            </Box>
            {items.length === 0 && <Typography variant="body2" color="text.secondary">Si la OC del cliente se divide en posiciones, cargalas acá.</Typography>}
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              {items.map((row, index) => (
                <Box key={index} display="grid" gridTemplateColumns={{ xs: '1fr auto', sm: '90px 1fr 150px auto' }} gap={1} alignItems="start">
                  <TextField size="small" label="Pos." value={row.position} onChange={(e) => updateItem(index, { position: e.target.value })} inputProps={{ maxLength: 20 }} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }} />
                  <TextField size="small" label="Descripción *" value={row.description} onChange={(e) => updateItem(index, { description: e.target.value })} inputProps={{ maxLength: 255 }} />
                  <TextField size="small" label="Monto" value={row.amount} onChange={(e) => updateItem(index, { amount: e.target.value })} inputProps={{ inputMode: 'decimal' }} sx={{ gridColumn: { xs: '1 / 2', sm: 'auto' } }} />
                  <IconButton aria-label="Quitar posición" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}><DeleteIcon /></IconButton>
                </Box>
              ))}
            </Stack>
          </Box>

          {mode.kind !== 'edit' && (
            <Box>
              <Typography variant="body2" color="text.secondary">Archivos de la OC (opcional): PDF, imágenes, Word o Excel, hasta 10 de 20 MB.</Typography>
              <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ mt: 1 }}>
                {files.length ? `${files.length} archivo${files.length === 1 ? '' : 's'} elegido${files.length === 1 ? '' : 's'}` : 'Adjuntar archivos'}
                <input hidden multiple type="file" accept={BILLING_FILE_ACCEPT} onChange={(e) => { setFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
              </Button>
              {files.length > 0 && <Typography variant="caption" color="text.secondary" display="block">{files.map((f) => f.name).join(', ')}</Typography>}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Guardando…' : mode.kind === 'replace' ? 'Reemplazar OC' : 'Guardar'}</Button>
      </DialogActions>
    </AppDialog>
  );
}
