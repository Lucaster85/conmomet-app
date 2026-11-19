'use client';
import React, { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import { BillableBudget, BudgetBillingDetail, InvoiceClientOption, InvoiceService } from '../../utils/api';
import { BILLING_STATUS_LABELS, formatMoney } from '../../utils/billing';

interface Props {
  open: boolean;
  onClose: () => void;
  clients: InvoiceClientOption[];
  // El primer presupuesto elegido es el ancla del diálogo de la factura; el resto va como extra.
  onStart: (detail: BudgetBillingDetail, extra: BudgetBillingDetail[]) => void;
}

// Primer paso de "Nueva factura" desde el listado (FLOWS.md §70): el cliente y los presupuestos que cobra la factura. Una factura puede cobrar varios
// presupuestos del mismo cliente; la que cobra uno solo se sigue armando también desde el detalle de ese presupuesto.
export default function NewInvoiceStartDialog({ open, onClose, clients, onStart }: Props) {
  const [client, setClient] = useState<InvoiceClientOption | null>(null);
  const [budgets, setBudgets] = useState<BillableBudget[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setClient(null); setBudgets([]); setSelected([]); setError(''); }
  }, [open]);

  useEffect(() => {
    if (!client) { setBudgets([]); setSelected([]); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    InvoiceService.getBillables({ client_id: client.id })
      .then((res) => { if (!cancelled) { setBudgets(res.data.filter((b) => b.billing.has_balance)); setSelected([]); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar los presupuestos'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [client]);

  const toggle = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const details = await Promise.all(selected.map((id) => InvoiceService.getBillable(id)));
      onStart(details[0], details.slice(1));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir los presupuestos');
    } finally {
      setStarting(false);
    }
  };

  return (
    <AppDialog open={open} onClose={starting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nueva factura</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2" color="text.secondary">
            Elegí el cliente y los presupuestos que cobra la factura. Una misma factura puede cobrar varios presupuestos del mismo cliente (y varias OC).
          </Typography>
          <Autocomplete
            options={clients.filter((c) => c.is_active)} value={client} getOptionLabel={(c) => c.razonSocial}
            onChange={(_, value) => setClient(value)}
            renderInput={(params) => <TextField {...params} label="Cliente *" />}
          />
          {client && !loading && budgets.length === 0 && (
            <Alert severity="info">{client.razonSocial} no tiene presupuestos aprobados con saldo para facturar.</Alert>
          )}
          {budgets.map((b) => {
            const status = BILLING_STATUS_LABELS[b.billing.billing_status];
            const balance = (['ARS', 'USD'] as const)
              .map((cur) => ({ cur, value: b.billing.balances[cur].materials + b.billing.balances[cur].labor }))
              .filter((x) => x.value > 0.01)
              .map((x) => formatMoney(x.value, x.cur))
              .join(' + ');
            return (
              <Box key={b.id} sx={{ border: 1, borderColor: selected.includes(b.id) ? 'primary.main' : 'divider', borderRadius: 2, px: 2, py: 0.5 }}>
                <FormControlLabel
                  control={<Checkbox checked={selected.includes(b.id)} onChange={() => toggle(b.id)} />}
                  label={(
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>{b.number} · {b.title}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {status.label} · Saldo neto {balance}
                        {b.purchase_order && b.purchase_order.active_count > 0 ? ` · OC ${b.purchase_order.numbers.join(', ')}` : ''}
                      </Typography>
                    </Box>
                  )}
                  sx={{ m: 0, width: '100%' }}
                />
              </Box>
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={starting}>Cancelar</Button>
        <Button variant="contained" onClick={handleStart} disabled={selected.length === 0 || starting}>
          {starting ? 'Abriendo…' : `Continuar${selected.length > 1 ? ` (${selected.length} presupuestos)` : ''}`}
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
