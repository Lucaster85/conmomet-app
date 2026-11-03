'use client';

import { useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/EditOutlined';
import { useRouter } from 'next/navigation';
import AppDialog from '@/components/common/AppDialog';
import CurrencyInput from '@/components/CurrencyInput';
import {
  EmployeeTermination, EmployeeTerminationService, PayrollService, TerminationFinalLine,
} from '@/utils/api';
import { TokenManager, userHasPermission } from '@/utils/auth';

const money = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS_LABEL = { draft: 'Borrador', confirmed: 'Confirmada', paid: 'Pagada' } as const;
const STATUS_COLOR = { draft: 'warning', confirmed: 'info', paid: 'success' } as const;
const NEGATIVE_LINE_TYPES = ['overpaid_deduction', 'employee_notice_deduction'];

interface Props {
  termination: EmployeeTermination;
  onChanged: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

/** Liquidación final del egreso: generar, corregir montos con motivo, confirmar y pagar. */
export default function TerminationFinalPayrollCard({ termination, onChanged, onError, onSuccess }: Props) {
  const router = useRouter();
  const user = TokenManager.getUser();
  const canGenerate = userHasPermission(user, 'payroll_write');
  const canUpdate = userHasPermission(user, 'payroll_update');

  const fp = termination.final_payroll || null;
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<TerminationFinalLine | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      onSuccess(successMessage);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (line: TerminationFinalLine) => {
    setEditing(line);
    setAmount(line.amount);
    setReason('');
  };

  const isDraft = fp?.status === 'draft';
  const lines = fp?.lines || [];
  const group = (g: 'remunerative' | 'indemnity') => lines.filter((l) => l.group === g);
  const deductionsTotal = (fp?.advances_deducted || 0) + (fp?.loan_installments_deducted || 0);

  const lineActions = (line: TerminationFinalLine) =>
    isDraft && canGenerate ? (
      <Tooltip title="Corregir el monto (con motivo)">
        <IconButton size="small" onClick={() => openEdit(line)} disabled={busy}><EditIcon fontSize="small" /></IconButton>
      </Tooltip>
    ) : null;

  const section = (title: string, items: TerminationFinalLine[], subtotal?: number) => {
    if (items.length === 0) return null;
    return (
      <Box>
        <Typography variant="subtitle2" mb={1}>{title}</Typography>

        {/* Mobile Cards */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Stack spacing={1.5}>
            {items.map((l) => (
              <Card key={l.id} sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" gap={1}>
                  <Typography fontWeight={600}>{l.label}</Typography>
                  <Typography fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>{money(l.amount)}</Typography>
                </Box>
                {l.edit_reason && (
                  <Typography variant="caption" color="warning.main" display="block">
                    Corregido (sugerido {money(l.suggested_amount ?? 0)}): {l.edit_reason}
                  </Typography>
                )}
                <Box mt={0.5}>{lineActions(l)}</Box>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Desktop Table */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Concepto</strong></TableCell>
                  <TableCell align="right"><strong>Sugerido</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                  <TableCell align="center" />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      {l.label}
                      {l.edit_reason && <Typography variant="caption" color="warning.main" display="block">Corregido: {l.edit_reason}</Typography>}
                    </TableCell>
                    <TableCell align="right">{l.suggested_amount != null ? money(l.suggested_amount) : '—'}</TableCell>
                    <TableCell align="right">{money(l.amount)}</TableCell>
                    <TableCell align="center">{lineActions(l)}</TableCell>
                  </TableRow>
                ))}
                {subtotal != null && (
                  <TableRow>
                    <TableCell colSpan={2}><strong>Subtotal</strong></TableCell>
                    <TableCell align="right"><strong>{money(subtotal)}</strong></TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    );
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight={600}>Liquidación final</Typography>
            {fp && <Chip size="small" color={STATUS_COLOR[fp.status]} label={STATUS_LABEL[fp.status]} />}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {fp && (
              <Button size="small" onClick={() => router.push(`/dashboard/pay-periods/${fp.pay_period_id}/payroll`)}>Ver en Liquidaciones</Button>
            )}
            {isDraft && canGenerate && (
              <Button size="small" variant="outlined" disabled={busy} onClick={() => run(() => EmployeeTerminationService.generateFinalPayroll(termination.id), 'Liquidación final regenerada.')}>
                Regenerar
              </Button>
            )}
            {isDraft && canUpdate && (
              <Button size="small" variant="contained" disabled={busy} onClick={() => run(() => PayrollService.confirm(fp!.id), 'Liquidación final confirmada.')}>
                Confirmar
              </Button>
            )}
            {fp?.status === 'confirmed' && canUpdate && (
              <Button size="small" variant="contained" color="success" disabled={busy} onClick={() => run(() => PayrollService.pay(fp.id), 'Liquidación final pagada.')}>
                Marcar como pagada
              </Button>
            )}
          </Stack>
        </Box>

        {!fp && (
          <Stack spacing={2} alignItems="flex-start">
            <Typography color="text.secondary">
              Todavía no se generó la liquidación final. Se arma con el cálculo de arriba: haberes del período sin liquidar,
              SAC, vacaciones, la indemnización que corresponda, y los descuentos de adelantos y préstamos. Después se puede
              corregir cada monto con un motivo antes de confirmarla.
            </Typography>
            {canGenerate ? (
              <Button variant="contained" disabled={busy} onClick={() => run(() => EmployeeTerminationService.generateFinalPayroll(termination.id), 'Liquidación final generada.')}>
                Generar liquidación final
              </Button>
            ) : (
              <Alert severity="info">No tenés permiso para generar liquidaciones.</Alert>
            )}
          </Stack>
        )}

        {fp && fp.lines && (
          <Stack spacing={3}>
            {isDraft && (
              <Alert severity="info">
                En borrador: cada monto se puede corregir (con motivo) y al regenerar se respetan las correcciones. Al
                <strong> confirmar</strong> se cobran los préstamos; al <strong>marcar como pagada</strong> se corta el acceso del empleado al portal.
              </Alert>
            )}
            {section('Remunerativo', group('remunerative'), fp.remunerative_total)}
            {section('Indemnizatorio / no remunerativo', group('indemnity'), fp.indemnity_total)}
            <Divider />
            <Box>
              <Box display="flex" justifyContent="space-between"><Typography fontWeight={700}>Total bruto</Typography><Typography fontWeight={700}>{money(fp.gross_amount || 0)}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography variant="body2">Adelantos descontados</Typography><Typography variant="body2" color="error.main">-{money(fp.advances_deducted || 0)}</Typography></Box>
              <Box display="flex" justifyContent="space-between"><Typography variant="body2">Préstamos cobrados</Typography><Typography variant="body2" color="error.main">-{money(fp.loan_installments_deducted || 0)}</Typography></Box>
              {deductionsTotal > 0 && fp.net_amount === 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>Los descuentos igualan lo que se le debe: el neto queda en $0 y lo que no entró es deuda pendiente.</Alert>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between"><Typography variant="h6" fontWeight={700}>Neto a pagar</Typography><Typography variant="h6" fontWeight={700}>{money(fp.net_amount || 0)}</Typography></Box>
            </Box>
          </Stack>
        )}
      </CardContent>

      <AppDialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Corregir monto</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <Typography variant="body2">
              {editing?.label}
              {editing?.suggested_amount != null && <> — sugerido <strong>{money(editing.suggested_amount)}</strong></>}
            </Typography>
            <CurrencyInput
              label="Monto"
              value={amount}
              onChange={setAmount}
              allowNegative={!!editing && NEGATIVE_LINE_TYPES.includes(editing.line_type)}
              showZero
              helperText={editing && NEGATIVE_LINE_TYPES.includes(editing.line_type) ? 'Es un descuento: cargalo en negativo (0 lo apaga).' : undefined}
              fullWidth
            />
            <TextField
              label="Motivo de la corrección"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              required
              helperText="Queda registrado en la auditoría."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={busy}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={busy || amount === null || !reason.trim()}
            onClick={() => editing && run(
              async () => {
                await EmployeeTerminationService.editFinalLine(termination.id, editing.id, { amount: amount ?? 0, reason: reason.trim() });
                setEditing(null);
              },
              'Monto corregido.'
            )}
          >
            Guardar
          </Button>
        </DialogActions>
      </AppDialog>
    </Card>
  );
}

