'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton,
  MenuItem, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import dayjs from 'dayjs';
import AppDialog from '@/components/common/AppDialog';
import CurrencyInput from '@/components/CurrencyInput';
import DateField from '@/components/DateField';
import SignaturePad from '@/components/SignaturePad';
import {
  EmployeeTermination, EmployeeTerminationService, TerminationAgreementInstallment, TerminationCalculation,
} from '@/utils/api';
import { TokenManager, userHasPermission } from '@/utils/auth';

const money = (n: number) => `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d?: string | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');
const round2 = (n: number) => Math.round(n * 100) / 100;

interface DraftInstallment {
  due_date: string;
  amount: number | null;
}

interface Props {
  termination: EmployeeTermination;
  onChanged: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

/**
 * Acuerdo de pago de la indemnización (PLAN_EGRESOS.md §7): cuotas de monto fijo, sin actualización
 * ni intereses. Con un acuerdo activo, preaviso, integración, art. 245 y la gratificación salen de la
 * liquidación final y se pagan cuota por cuota.
 */
export default function TerminationAgreementCard({ termination, onChanged, onError, onSuccess }: Props) {
  const user = TokenManager.getUser();
  const canWrite = userHasPermission(user, 'termination_agreements_write');
  const agreement = termination.agreement || null;
  const installments = agreement?.installments || [];
  const anyPaid = installments.some((i) => i.paid_at);
  const finalPaidOrConfirmed = termination.final_payroll && termination.final_payroll.status !== 'draft';

  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [agreementDate, setAgreementDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [homologated, setHomologated] = useState(false);
  const [notes, setNotes] = useState('');
  const [count, setCount] = useState(3);
  const [firstDue, setFirstDue] = useState(dayjs().add(1, 'month').endOf('month').format('YYYY-MM-DD'));
  const [rows, setRows] = useState<DraftInstallment[]>([]);
  const [legalAmount, setLegalAmount] = useState<number | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [payTarget, setPayTarget] = useState<TerminationAgreementInstallment | null>(null);
  const [payMethod, setPayMethod] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [payDate, setPayDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [proof, setProof] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);

  // El monto legal calculado, para precargar el total: preaviso + integración + art. 245 y sus SAC.
  useEffect(() => {
    if (agreement || !termination.id) return;
    EmployeeTerminationService.getCalculation(termination.id)
      .then((calc: TerminationCalculation) => {
        const sum = calc.items
          .filter((i) => i.group === 'indemnity' && i.applies && i.key !== 'severance_agreed')
          .reduce((s, i) => s + i.amount, 0);
        setLegalAmount(sum > 0 ? round2(sum) : null);
      })
      .catch(() => setLegalAmount(null));
  }, [agreement, termination.id]);

  const run = async (action: () => Promise<unknown>, successMessage: string, after?: () => void) => {
    setBusy(true);
    try {
      await action();
      after?.();
      onSuccess(successMessage);
      onChanged();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  /** Reparte el total en N cuotas mensuales iguales; la última absorbe el redondeo. */
  const generateRows = (totalAmount: number | null, n: number, first: string) => {
    if (!totalAmount || totalAmount <= 0 || n < 1) return [];
    const base = Math.floor((totalAmount / n) * 100) / 100;
    return Array.from({ length: n }, (_, idx) => ({
      due_date: dayjs(first).add(idx, 'month').format('YYYY-MM-DD'),
      amount: idx === n - 1 ? round2(totalAmount - base * (n - 1)) : base,
    }));
  };

  const openForm = (editing: boolean) => {
    if (editing && agreement) {
      setTotal(agreement.total_amount ?? null);
      setAgreementDate(agreement.agreement_date);
      setHomologated(agreement.homologated);
      setNotes(agreement.notes || '');
      setRows(installments.map((i) => ({ due_date: i.due_date, amount: i.amount })));
      setCount(installments.length);
    } else {
      setTotal(legalAmount);
      setAgreementDate(dayjs().format('YYYY-MM-DD'));
      setHomologated(false);
      setNotes('');
      setCount(3);
      setRows(generateRows(legalAmount, 3, firstDue));
    }
    setFormOpen(true);
  };

  const rowsSum = useMemo(() => round2(rows.reduce((s, r) => s + (r.amount || 0), 0)), [rows]);
  const rowsValid = rows.length > 0 && rows.every((r) => r.due_date && (r.amount || 0) > 0);
  const sumMatches = total != null && Math.abs(rowsSum - total) < 0.01;

  const submitForm = () =>
    run(
      () => {
        const data = {
          total_amount: total as number,
          agreement_date: agreementDate,
          homologated,
          notes: notes.trim() || undefined,
          installments: rows.map((r) => ({ due_date: r.due_date, amount: r.amount as number })),
        };
        return agreement ? EmployeeTerminationService.updateAgreement(termination.id, data) : EmployeeTerminationService.createAgreement(termination.id, data);
      },
      agreement ? 'Acuerdo actualizado.' : 'Acuerdo de pago creado.',
      () => setFormOpen(false)
    );

  const openPay = (i: TerminationAgreementInstallment) => {
    setPayTarget(i);
    setPayMethod('efectivo');
    setPayDate(dayjs().format('YYYY-MM-DD'));
    setProof(null);
    setSignature(null);
  };

  const statusChip = (i: TerminationAgreementInstallment) =>
    i.paid_at ? <Chip size="small" color="success" label={`Pagada ${fmt(i.paid_at)}`} />
      : i.overdue ? <Chip size="small" color="error" label="Vencida" />
        : <Chip size="small" variant="outlined" label="Pendiente" />;

  const instActions = (i: TerminationAgreementInstallment) => (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
      {i.payment_proof_url && <Button size="small" href={i.payment_proof_url} target="_blank" rel="noopener noreferrer">Comprobante</Button>}
      {!i.paid_at && canWrite && <Button size="small" variant="contained" onClick={() => openPay(i)} disabled={busy}>Marcar pagada</Button>}
    </Stack>
  );

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontWeight={600}>Acuerdo de pago de la indemnización</Typography>
            {agreement && <Chip size="small" color={agreement.homologated ? 'success' : 'default'} label={agreement.homologated ? 'Homologado' : 'Sin homologar'} />}
          </Box>
          {agreement && canWrite && !anyPaid && (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => openForm(true)} disabled={busy}>Editar</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => { setCancelReason(''); setCancelOpen(true); }} disabled={busy}>Anular acuerdo</Button>
            </Stack>
          )}
        </Box>

        {!agreement && (
          <Stack spacing={2} alignItems="flex-start">
            <Typography color="text.secondary">
              Por defecto la indemnización se paga contado dentro de la liquidación final. Si se pacta en cuotas (o si hay un reclamo
              posterior a un despido con causa), cargá el acuerdo: <strong>preaviso, integración, art. 245 y gratificación salen de la
              liquidación final</strong> y se pagan cuota por cuota, en montos fijos, sin actualización ni intereses.
            </Typography>
            {finalPaidOrConfirmed && (
              <Alert severity="info">
                La liquidación final ya está confirmada: solo se puede pactar en cuotas lo que todavía no se liquidó contado.
              </Alert>
            )}
            {canWrite ? (
              <Button variant="outlined" onClick={() => openForm(false)} disabled={busy}>Pactar acuerdo de pago</Button>
            ) : (
              <Alert severity="info">No tenés permiso para cargar acuerdos de pago.</Alert>
            )}
          </Stack>
        )}

        {agreement && (
          <Stack spacing={2}>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }} gap={2}>
              <Box><Typography variant="caption" color="text.secondary">Total pactado</Typography><Typography fontWeight={600}>{money(agreement.total_amount || 0)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Fecha del acuerdo</Typography><Typography>{fmt(agreement.agreement_date)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Pagado</Typography><Typography color="success.main" fontWeight={600}>{money(agreement.paid_total || 0)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Pendiente</Typography><Typography color={(agreement.overdue_count || 0) > 0 ? 'error.main' : undefined} fontWeight={600}>{money(agreement.pending_total || 0)}</Typography></Box>
            </Box>
            {agreement.notes && <Typography variant="body2" color="text.secondary">{agreement.notes}</Typography>}
            <Alert severity="info">
              Subí el documento del acuerdo como <strong>documento del egreso</strong> (categoría &quot;Acuerdo / convenio de pago&quot;). El egreso pasa a
              <strong> liquidado</strong> cuando la liquidación final está pagada y todas las cuotas también.
            </Alert>

            {/* Mobile Cards */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <Stack spacing={1.5}>
                {installments.map((i) => (
                  <Card key={i.id} sx={{ p: 2, borderRadius: 2 }}>
                    <Box display="flex" justifyContent="space-between" gap={1}>
                      <Typography fontWeight={600}>Cuota {i.installment_number}</Typography>
                      {statusChip(i)}
                    </Box>
                    <Typography variant="body2">Vence {fmt(i.due_date)} — {money(i.amount)}</Typography>
                    {i.paid_at && <Typography variant="caption" color="text.secondary">{i.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo'}</Typography>}
                    <Box mt={1}>{instActions(i)}</Box>
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
                      <TableCell><strong>Cuota</strong></TableCell>
                      <TableCell><strong>Vencimiento</strong></TableCell>
                      <TableCell align="right"><strong>Monto</strong></TableCell>
                      <TableCell><strong>Estado</strong></TableCell>
                      <TableCell><strong>Medio</strong></TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {installments.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.installment_number} / {installments.length}</TableCell>
                        <TableCell>{fmt(i.due_date)}</TableCell>
                        <TableCell align="right">{money(i.amount)}</TableCell>
                        <TableCell>{statusChip(i)}</TableCell>
                        <TableCell>{i.paid_at ? (i.payment_method === 'transferencia' ? 'Transferencia' : 'Efectivo') : '—'}</TableCell>
                        <TableCell align="right">{instActions(i)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        )}
      </CardContent>

      <AppDialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{agreement ? 'Editar acuerdo de pago' : 'Pactar acuerdo de pago'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <CurrencyInput
              label="Total pactado"
              value={total}
              onChange={(v) => { setTotal(v); setRows(generateRows(v, count, firstDue)); }}
              helperText={legalAmount != null && !agreement ? `Precargado con el monto legal calculado (${money(legalAmount)}); editalo si se pactó otro.` : 'Monto acordado con el empleado.'}
              fullWidth
              required
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <DateField label="Fecha del acuerdo" value={agreementDate} onChange={setAgreementDate} fullWidth />
              <FormControlLabel control={<Switch checked={homologated} onChange={(e) => setHomologated(e.target.checked)} />} label="Homologado (SECLO / ministerio)" />
            </Stack>
            <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth />

            <Typography variant="subtitle2">Cuotas</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField
                label="Cantidad de cuotas" type="number" value={count} inputProps={{ min: 1, max: 60 }}
                onChange={(e) => setCount(Math.max(1, Math.min(60, Number(e.target.value) || 1)))} sx={{ maxWidth: 180 }}
              />
              <DateField label="Primer vencimiento" value={firstDue} onChange={setFirstDue} />
              <Button variant="outlined" onClick={() => setRows(generateRows(total, count, firstDue))} disabled={!total}>Repartir en cuotas iguales</Button>
            </Stack>
            <Stack spacing={1.5}>
              {rows.map((r, idx) => (
                <Stack key={idx} direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ minWidth: 28 }}>{idx + 1}.</Typography>
                  <DateField label="Vence" value={r.due_date} onChange={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, due_date: v } : x)))} fullWidth />
                  <CurrencyInput label="Monto" value={r.amount} onChange={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, amount: v } : x)))} fullWidth />
                  <Tooltip title="Quitar cuota">
                    <IconButton onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))} disabled={rows.length <= 1}><DeleteIcon /></IconButton>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
            <Alert severity={sumMatches ? 'success' : 'warning'}>
              Las cuotas suman {money(rowsSum)}{total != null ? ` de ${money(total)}` : ''}.{!sumMatches && ' Tienen que coincidir con el total pactado.'}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={submitForm} disabled={busy || !total || !rowsValid || !sumMatches || !agreementDate}>
            {agreement ? 'Guardar cambios' : 'Crear acuerdo'}
          </Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Anular el acuerdo</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Se anulan el acuerdo y sus cuotas. Si la liquidación final sigue en borrador, la indemnización vuelve a ella; si ya está confirmada,
            la indemnización queda sin liquidar y hay que pactar un acuerdo nuevo.
          </Typography>
          <TextField label="Motivo de la anulación" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} multiline minRows={2} fullWidth required autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={busy}>Volver</Button>
          <Button
            color="error" variant="contained" disabled={busy || !cancelReason.trim()}
            onClick={() => run(() => EmployeeTerminationService.cancelAgreement(termination.id, cancelReason.trim()), 'Acuerdo anulado.', () => setCancelOpen(false))}
          >
            Anular acuerdo
          </Button>
        </DialogActions>
      </AppDialog>

      <AppDialog open={!!payTarget} onClose={() => setPayTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cuota {payTarget?.installment_number} — {payTarget ? money(payTarget.amount) : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <TextField select label="Medio de pago" value={payMethod} onChange={(e) => setPayMethod(e.target.value as 'efectivo' | 'transferencia')} fullWidth>
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
            </TextField>
            <DateField label="Fecha de pago" value={payDate} onChange={setPayDate} fullWidth />
            <Button component="label" variant="outlined">
              {proof ? proof.name : 'Adjuntar comprobante (opcional)'}
              <input type="file" hidden onChange={(e) => setProof(e.target.files?.[0] || null)} />
            </Button>
            <SignaturePad label="Firma del empleado (opcional)" onChange={setSignature} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayTarget(null)} disabled={busy}>Cancelar</Button>
          <Button
            variant="contained" disabled={busy || !payDate}
            onClick={() => payTarget && run(
              () => EmployeeTerminationService.payInstallment(termination.id, payTarget.installment_number, { payment_method: payMethod, paid_at: payDate }, { proof, signature }),
              'Cuota registrada como pagada.',
              () => setPayTarget(null)
            )}
          >
            Registrar pago
          </Button>
        </DialogActions>
      </AppDialog>
    </Card>
  );
}
