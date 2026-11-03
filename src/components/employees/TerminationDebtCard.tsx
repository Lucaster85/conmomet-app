'use client';

import { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import AppDialog from '@/components/common/AppDialog';
import { EmployeeTermination, EmployeeTerminationService } from '@/utils/api';

const money = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  termination: EmployeeTermination;
  canConfirm: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

/**
 * Deuda pendiente del empleado (PLAN_EGRESOS.md §6.2): cuando los descuentos de la liquidación final
 * superan lo que se le debe, el neto queda en 0 y lo que no entró queda acá. Se resuelve de una sola
 * vez: el empleado la devuelve ("Registrar pago") o la empresa la perdona ("Condonar", con motivo).
 */
export default function TerminationDebtCard({ termination, canConfirm, onChanged, onError, onSuccess }: Props) {
  const debt = termination.pending_debt;
  const resolved = termination.debt_resolution;
  const [mode, setMode] = useState<'paid' | 'condoned' | null>(null);
  const [method, setMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const hasDebt = !!debt && !debt.resolved && (debt.total_ars > 0 || debt.loans.has_usd);
  if (!hasDebt && !resolved) return null;

  const submit = async () => {
    if (!mode) return;
    setBusy(true);
    try {
      await EmployeeTerminationService.resolveDebt(termination.id, {
        resolution: mode,
        ...(mode === 'paid' ? { payment_method: method } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setMode(null);
      onSuccess(mode === 'paid' ? 'Pago de la deuda registrado.' : 'Deuda condonada.');
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al resolver la deuda');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: resolved ? 'success.main' : 'error.main' }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Typography variant="h6" fontWeight={600}>Deuda pendiente del empleado</Typography>
          {resolved && <Chip size="small" color="success" label={resolved.resolution === 'paid' ? 'Devuelta' : 'Condonada'} />}
        </Box>

        {resolved ? (
          <Typography variant="body2" color="text.secondary">
            {resolved.resolution === 'paid'
              ? `El empleado devolvió ${resolved.amount != null ? money(resolved.amount) : 'la deuda'} (${resolved.payment_method === 'transferencia' ? 'transferencia' : 'efectivo'}) el ${dayjs(resolved.resolved_at).format('DD/MM/YYYY')}.`
              : `La deuda${resolved.amount != null ? ` de ${money(resolved.amount)}` : ''} se condonó el ${dayjs(resolved.resolved_at).format('DD/MM/YYYY')}.`}
            {resolved.notes ? ` Motivo: ${resolved.notes}` : ''}
          </Typography>
        ) : debt && (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700} color="error.main">{money(debt.total_ars)}</Typography>
            <Stack spacing={0.5}>
              {debt.advances.items.map((a) => (
                <Box key={a.id} display="flex" justifyContent="space-between"><Typography variant="body2">Adelanto del {dayjs(a.date).format('DD/MM/YYYY')} (sin descontar)</Typography><Typography variant="body2">{money(a.amount)}</Typography></Box>
              ))}
              {debt.loans.items.map((l) => (
                <Box key={l.loan_id} display="flex" justifyContent="space-between">
                  <Typography variant="body2">Préstamo #{l.loan_id} (cuotas sin cobrar)</Typography>
                  <Typography variant="body2">{l.currency === 'USD' ? `US$ ${l.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : money(l.amount)}</Typography>
                </Box>
              ))}
            </Stack>
            <Alert severity="info">
              El egreso no pasa a <strong>liquidado</strong> hasta que la deuda se resuelva. <strong>Registrar pago</strong>: el empleado devolvió la plata
              (los adelantos se anulan y los préstamos se liquidan). <strong>Condonar</strong>: la empresa la perdona (las cuotas se cancelan; los adelantos quedan como costo).
            </Alert>
            {canConfirm && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="contained" onClick={() => { setMode('paid'); setNotes(''); }}>Registrar pago</Button>
                <Button variant="outlined" color="error" onClick={() => { setMode('condoned'); setNotes(''); }}>Condonar</Button>
              </Stack>
            )}
          </Stack>
        )}
      </CardContent>

      <AppDialog open={!!mode} onClose={() => setMode(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{mode === 'paid' ? 'Registrar pago de la deuda' : 'Condonar la deuda'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <Typography variant="body2">
              {mode === 'paid'
                ? `El empleado devuelve ${debt ? money(debt.total_ars) : ''}. Subí el comprobante como documento del egreso.`
                : 'La empresa perdona lo que el empleado debe. Queda registrado en la auditoría.'}
            </Typography>
            {mode === 'paid' && (
              <TextField select label="¿Cómo lo devolvió?" value={method} onChange={(e) => setMethod(e.target.value as 'efectivo' | 'transferencia')} fullWidth>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
              </TextField>
            )}
            <TextField
              label={mode === 'condoned' ? 'Motivo de la condonación' : 'Notas (opcional)'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              required={mode === 'condoned'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMode(null)} disabled={busy}>Cancelar</Button>
          <Button variant="contained" color={mode === 'condoned' ? 'error' : 'primary'} onClick={submit} disabled={busy || (mode === 'condoned' && !notes.trim())}>
            {mode === 'paid' ? 'Registrar pago' : 'Condonar'}
          </Button>
        </DialogActions>
      </AppDialog>
    </Card>
  );
}
