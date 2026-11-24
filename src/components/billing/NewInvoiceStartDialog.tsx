'use client';
import React, { useEffect, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography,
} from '@mui/material';
import AppDialog from '@/components/common/AppDialog';
import FeedbackModal from '../FeedbackModal';
import { BillableBudget, BillableOca, BudgetBillingDetail, InvoiceClientOption, InvoiceService } from '../../utils/api';
import { BILLING_STATUS_LABELS, formatMoney } from '../../utils/billing';

interface Props {
  open: boolean;
  onClose: () => void;
  clients: InvoiceClientOption[];
  // El primer presupuesto elegido es el ancla del diálogo de la factura; el resto va como extra.
  // Sin presupuestos elegidos, `detail` es null y la factura es solo de OCA (FLOWS.md §74).
  onStart: (detail: BudgetBillingDetail | null, extra: BudgetBillingDetail[], ocas: BillableOca[], client: InvoiceClientOption) => void;
}

// Primer paso de "Nueva factura" desde el listado (FLOWS.md §70): el cliente y los presupuestos que cobra la factura. Una factura puede cobrar varios
// presupuestos del mismo cliente; la que cobra uno solo se sigue armando también desde el detalle de ese presupuesto.
export default function NewInvoiceStartDialog({ open, onClose, clients, onStart }: Props) {
  const [client, setClient] = useState<InvoiceClientOption | null>(null);
  const [budgets, setBudgets] = useState<BillableBudget[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [ocas, setOcas] = useState<BillableOca[]>([]);
  const [selectedOcas, setSelectedOcas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setClient(null); setBudgets([]); setSelected([]); setOcas([]); setSelectedOcas([]); setError(''); }
  }, [open]);

  useEffect(() => {
    if (!client) { setBudgets([]); setSelected([]); setOcas([]); setSelectedOcas([]); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([InvoiceService.getBillables({ client_id: client.id }), InvoiceService.getBillableOcas(client.id)])
      .then(([res, ocaList]) => { if (!cancelled) { setBudgets(res.data.filter((b) => b.billing.has_balance)); setSelected([]); setOcas(ocaList); setSelectedOcas([]); } })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar los presupuestos'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [client]);

  const toggle = (id: number) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleOca = (id: number) => setSelectedOcas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleStart = async () => {
    if (!client) return;
    setStarting(true);
    setError('');
    try {
      const details = await Promise.all(selected.map((id) => InvoiceService.getBillable(id)));
      onStart(details[0] || null, details.slice(1), ocas.filter((o) => selectedOcas.includes(o.id)), client);
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
          <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
          <Typography variant="body2" color="text.secondary">
            Elegí el cliente y lo que cobra la factura: presupuestos y/o OCA aprobadas. Una misma factura puede cobrar varios presupuestos del mismo cliente (y varias OC).
          </Typography>
          <Autocomplete
            options={clients.filter((c) => c.is_active)} value={client} getOptionLabel={(c) => c.razonSocial}
            onChange={(_, value) => setClient(value)}
            renderInput={(params) => <TextField {...params} label="Cliente *" />}
          />
          {client && !loading && budgets.length === 0 && ocas.length === 0 && (
            <Alert severity="info">{client.razonSocial} no tiene presupuestos aprobados con saldo ni OCA aprobadas para facturar.</Alert>
          )}
          {budgets.length > 0 && <Typography variant="subtitle2" fontWeight={700}>Presupuestos</Typography>}
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
          {ocas.length > 0 && (
            <>
              <Typography variant="subtitle2" fontWeight={700}>OCA aprobadas</Typography>
              {ocas.map((o) => {
                const blocked = !o.billable;
                return (
                  <Box key={o.id} sx={{ border: 1, borderColor: selectedOcas.includes(o.id) ? 'primary.main' : 'divider', borderRadius: 2, px: 2, py: 0.5, opacity: blocked ? 0.7 : 1 }}>
                    <FormControlLabel
                      control={<Checkbox checked={selectedOcas.includes(o.id)} disabled={blocked} onChange={() => toggleOca(o.id)} />}
                      label={(
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>OCA {o.number} · {o.type === 'man_hours' ? 'Horas hombre' : 'Grúa'} · {formatMoney(o.net_amount, 'ARS')}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {o.hours.total} hs{o.project ? ` · ${o.project.code}` : ''}
                            {o.invoice ? ' · ya está facturada' : o.problems.length > 0 ? ` · ${o.problems.join(' ')}` : ''}
                          </Typography>
                        </Box>
                      )}
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Box>
                );
              })}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={starting}>Cancelar</Button>
        <Button variant="contained" onClick={handleStart} disabled={(selected.length === 0 && selectedOcas.length === 0) || starting}>
          {starting ? 'Abriendo…' : `Continuar${selected.length + selectedOcas.length > 1 ? ` (${selected.length + selectedOcas.length} elegidos)` : ''}`}
        </Button>
      </DialogActions>
    </AppDialog>
  );
}
