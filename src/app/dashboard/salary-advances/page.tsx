'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, TextField, Stack, Chip, Autocomplete, Grid, useTheme, useMediaQuery
} from '@mui/material';
import FeedbackModal from '../../../components/FeedbackModal';
import DateField from '../../../components/DateField';
import CurrencyInput from '../../../components/CurrencyInput';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import {
  Add as AddIcon, Refresh as RefreshIcon,
  LocalAtm as CashIcon, AccountBalance as BankIcon,
  CheckCircle as ApproveIcon, Cancel as RejectIcon,
  WarningAmber as ConflictIcon, Payments as PaidIcon,
  AttachFile as ProofIcon, UploadFile as UploadProofIcon
} from '@mui/icons-material';
import { SalaryAdvance, SalaryAdvanceService, Employee, EmployeeService } from '../../../utils/api';

const STATUS_LABEL: Record<string, { label: string; color: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'Pendiente', color: 'warning' },
  approved: { label: 'Aprobado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'error' },
};

export default function SalaryAdvancesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  // Filters
  const [filterEmployee, setFilterEmployee] = useState<number | ''>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'discounted'>('all');

  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState<{ amount: number | null; date: string; notes: string; payment_method: 'efectivo' | 'transferencia'; mark_as_paid: boolean }>({
    amount: null,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    payment_method: 'transferencia',
    mark_as_paid: true,
  });
  const [createProofFile, setCreateProofFile] = useState<File | null>(null);

  // Aprobación / rechazo
  const [approveTarget, setApproveTarget] = useState<SalaryAdvance | null>(null);
  const [approveAmount, setApproveAmount] = useState<number | null>(null);
  const [approvePaymentMethod, setApprovePaymentMethod] = useState<'efectivo' | 'transferencia'>('transferencia');
  const [approveMarkAsPaid, setApproveMarkAsPaid] = useState(true);
  const [approveProofFile, setApproveProofFile] = useState<File | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SalaryAdvance | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [markPaidTarget, setMarkPaidTarget] = useState<SalaryAdvance | null>(null);
  const [markPaidMethod, setMarkPaidMethod] = useState<'efectivo' | 'transferencia'>('transferencia');
  const [markPaidProofFile, setMarkPaidProofFile] = useState<File | null>(null);
  const [uploadProofTarget, setUploadProofTarget] = useState<SalaryAdvance | null>(null);
  const [uploadProofFile, setUploadProofFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [advs, emps] = await Promise.all([
        SalaryAdvanceService.getAll(),
        EmployeeService.getAll()
      ]);
      setAdvances(advs);
      setEmployees(emps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenDialog = () => {
    setSelectedEmployees([]);
    setForm({
      amount: null,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      payment_method: 'transferencia',
      mark_as_paid: true,
    });
    setCreateProofFile(null);
    setOpenDialog(true);
  };

  const isCreateProofRequired = form.payment_method === 'transferencia' && form.mark_as_paid && selectedEmployees.length <= 1;

  const handleSubmit = async () => {
    if (selectedEmployees.length === 0 || !form.amount || !form.date) {
      setError('Campos obligatorios');
      return;
    }
    if (isCreateProofRequired && !createProofFile) {
      setError('El comprobante de pago es obligatorio para transferencias.');
      return;
    }
    try {
      await SalaryAdvanceService.create({
        employee_ids: selectedEmployees.map(e => e.id),
        amount: form.amount!,
        date: form.date,
        payment_method: form.payment_method,
        notes: form.notes,
        mark_as_paid: form.mark_as_paid,
      }, createProofFile);
      setSuccess(selectedEmployees.length > 1 ? 'Adelantos registrados en lote' : 'Adelanto registrado');
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleOpenApprove = (advance: SalaryAdvance) => {
    setApproveTarget(advance);
    setApproveAmount(Number(advance.requested_amount ?? advance.amount));
    setApprovePaymentMethod(advance.payment_method || 'transferencia');
    setApproveMarkAsPaid(true);
    setApproveProofFile(null);
  };

  const isApproveProofRequired = approveMarkAsPaid && approvePaymentMethod === 'transferencia';

  const handleConfirmApprove = async () => {
    if (!approveTarget || !approveAmount) return;
    if (isApproveProofRequired && !approveProofFile) {
      setError('El comprobante de pago es obligatorio para transferencias.');
      return;
    }
    setProcessing(true);
    try {
      await SalaryAdvanceService.approve(approveTarget.id, {
        amount: approveAmount,
        payment_method: approvePaymentMethod,
        mark_as_paid: approveMarkAsPaid,
      }, approveProofFile);
      setSuccess(approveMarkAsPaid ? 'Adelanto aprobado y marcado como pagado' : 'Adelanto aprobado — queda pendiente de pago');
      setApproveTarget(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenMarkPaid = (advance: SalaryAdvance) => {
    setMarkPaidTarget(advance);
    setMarkPaidMethod(advance.payment_method || 'transferencia');
    setMarkPaidProofFile(null);
  };

  const isMarkPaidProofRequired = markPaidMethod === 'transferencia';

  const handleConfirmMarkPaid = async () => {
    if (!markPaidTarget) return;
    if (isMarkPaidProofRequired && !markPaidProofFile) {
      setError('El comprobante de pago es obligatorio para transferencias.');
      return;
    }
    setProcessing(true);
    try {
      await SalaryAdvanceService.markAsPaid(markPaidTarget.id, { payment_method: markPaidMethod }, markPaidProofFile);
      setSuccess('Adelanto marcado como pagado');
      setMarkPaidTarget(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar como pagado');
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenUploadProof = (advance: SalaryAdvance) => {
    setUploadProofTarget(advance);
    setUploadProofFile(null);
  };

  const handleConfirmUploadProof = async () => {
    if (!uploadProofTarget || !uploadProofFile) return;
    setProcessing(true);
    try {
      await SalaryAdvanceService.uploadPaymentProof(uploadProofTarget.id, uploadProofFile);
      setSuccess('Comprobante cargado correctamente');
      setUploadProofTarget(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el comprobante');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setProcessing(true);
    try {
      await SalaryAdvanceService.reject(rejectTarget.id, rejectNotes || undefined);
      setSuccess('Adelanto rechazado');
      setRejectTarget(null);
      setRejectNotes('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (v: number) => `$${Number(v).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-AR');

  const renderPaymentMethodChip = (method?: 'efectivo' | 'transferencia' | null) => {
    if (!method) {
      return <Typography variant="body2" color="text.secondary">—</Typography>;
    }
    if (method === 'efectivo') {
      return (
        <Tooltip title="Efectivo">
          <CashIcon fontSize="small" sx={{ color: 'warning.main', display: 'block' }} />
        </Tooltip>
      );
    }
    return (
      <Tooltip title="Transferencia bancaria">
        <BankIcon fontSize="small" sx={{ color: 'info.main', display: 'block' }} />
      </Tooltip>
    );
  };

  const renderPaidChip = (a: SalaryAdvance) => {
    if (a.status !== 'approved') return null;
    if (a.paid_at) {
      return (
        <Tooltip title={`Pagado el ${new Date(a.paid_at).toLocaleDateString('es-AR')}`}>
          <Chip label="Pagado" size="small" color="success" variant="outlined" />
        </Tooltip>
      );
    }
    return <Chip label="Pendiente de pago" size="small" color="info" variant="outlined" />;
  };

  const filteredAdvances = advances.filter(a => {
    if (filterEmployee && a.employee_id !== filterEmployee) return false;
    if (filterStatus === 'pending' && a.pay_period_id) return false;
    if (filterStatus === 'discounted' && !a.pay_period_id) return false;
    return true;
  });

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Typography variant="h4" fontWeight="bold">Adelantos</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} size="small">Actualizar</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenDialog} size="small">Registrar Adelanto</Button>
        </Box>
      </Box>

      <FeedbackModal open={!!error} onClose={() => setError('')} message={error} type="error" />
      <FeedbackModal open={!!success} onClose={() => setSuccess('')} message={success} type="success" />

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Empleado"
              select
              size="small"
              fullWidth
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value ? Number(e.target.value) : '')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="">Todos los empleados</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.lastname}, {e.name}</option>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Estado"
              select
              size="small"
              fullWidth
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'discounted')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="all">Todos los adelantos</option>
              <option value="pending">Pendiente de descuento</option>
              <option value="discounted">Descontado</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Mobile view */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {filteredAdvances.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay adelantos para los filtros seleccionados</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {filteredAdvances.map(a => (
              <Paper key={a.id} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                  <Typography variant="subtitle1" fontWeight="bold">{a.employee?.lastname}, {a.employee?.name}</Typography>
                  {a.conflict_warning && (
                    <Tooltip title={a.conflict_warning}>
                      <ConflictIcon color="warning" fontSize="small" />
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="h6" color="error.main">{formatCurrency(a.amount)}</Typography>
                <Typography variant="body2">{formatDate(a.date)}</Typography>
                {a.notes && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{a.notes}</Typography>}
                <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
                  <Chip label={STATUS_LABEL[a.status]?.label || a.status} size="small" color={STATUS_LABEL[a.status]?.color || 'default'} />
                  {renderPaidChip(a)}
                  {renderPaymentMethodChip(a.payment_method)}
                  {a.pay_period_id ? <Chip label="Descontado" size="small" color="success" /> : <Chip label="Pendiente de descuento" size="small" color="warning" />}
                </Box>
                {a.status === 'pending' && (
                  <Box mt={1.5} display="flex" gap={1}>
                    <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handleOpenApprove(a)}>Aprobar</Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => setRejectTarget(a)}>Rechazar</Button>
                  </Box>
                )}
                {a.status === 'approved' && !a.paid_at && (
                  <Box mt={1.5}>
                    <Button size="small" variant="contained" color="info" startIcon={<PaidIcon />} onClick={() => handleOpenMarkPaid(a)} disabled={processing}>Marcar como pagado</Button>
                  </Box>
                )}
                {a.paid_at && !a.payment_proof_url && (
                  <Box mt={1.5}>
                    <Button size="small" variant="outlined" startIcon={<UploadProofIcon />} onClick={() => handleOpenUploadProof(a)} disabled={processing}>Cargar comprobante</Button>
                  </Box>
                )}
                {a.payment_proof_url && (
                  <Box mt={1.5}>
                    <Button size="small" variant="outlined" startIcon={<ProofIcon />} component="a" href={a.payment_proof_url} target="_blank" rel="noopener noreferrer">
                      Ver comprobante
                    </Button>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Desktop view */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Monto</strong></TableCell>
                <TableCell><strong>Método</strong></TableCell>
                <TableCell><strong>Notas</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Aprobación</strong></TableCell>
                <TableCell align="right"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAdvances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No hay adelantos para los filtros seleccionados</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdvances.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell>{formatDate(a.date)}</TableCell>
                    <TableCell>{a.employee?.lastname}, {a.employee?.name}</TableCell>
                    <TableCell><Typography color="error.main" fontWeight="bold">{formatCurrency(a.amount)}</Typography></TableCell>
                    <TableCell>{renderPaymentMethodChip(a.payment_method)}</TableCell>
                    <TableCell>{a.notes || '—'}</TableCell>
                    <TableCell>{a.pay_period_id ? <Chip label="Descontado" size="small" color="success" /> : <Chip label="Pendiente de descuento" size="small" color="warning" />}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                        <Chip label={STATUS_LABEL[a.status]?.label || a.status} size="small" color={STATUS_LABEL[a.status]?.color || 'default'} />
                        {renderPaidChip(a)}
                        {a.conflict_warning && (
                          <Tooltip title={a.conflict_warning}>
                            <ConflictIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {a.status === 'pending' && (
                        <Box display="flex" gap={0.5} justifyContent="flex-end">
                          <Tooltip title="Aprobar">
                            <IconButton size="small" color="success" onClick={() => handleOpenApprove(a)}><ApproveIcon fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Rechazar">
                            <IconButton size="small" color="error" onClick={() => setRejectTarget(a)}><RejectIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      {a.status === 'approved' && !a.paid_at && (
                        <Box display="flex" gap={0.5} justifyContent="flex-end">
                          <Tooltip title="Marcar como pagado">
                            <IconButton size="small" color="info" onClick={() => handleOpenMarkPaid(a)} disabled={processing}><PaidIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      {a.paid_at && !a.payment_proof_url && (
                        <Box display="flex" gap={0.5} justifyContent="flex-end">
                          <Tooltip title="Cargar comprobante">
                            <IconButton size="small" color="primary" onClick={() => handleOpenUploadProof(a)} disabled={processing}><UploadProofIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      {a.payment_proof_url && (
                        <Box display="flex" gap={0.5} justifyContent="flex-end">
                          <Tooltip title="Ver comprobante">
                            <IconButton size="small" color="primary" component="a" href={a.payment_proof_url} target="_blank" rel="noopener noreferrer">
                              <ProofIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Registrar Adelanto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Autocomplete
              multiple
              options={employees.filter(e => e.status !== 'inactive')}
              getOptionLabel={(e) => `${e.lastname}, ${e.name}`}
              value={selectedEmployees}
              onChange={(_, val) => setSelectedEmployees(val)}
              renderInput={(params) => <TextField {...params} label="Empleado(s) *" placeholder="Seleccionar..." />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...rest } = getTagProps({ index });
                  return <Chip key={key} label={`${option.name} ${option.lastname}`} size="small" {...rest} />;
                })
              }
            />
            <DateField label="Fecha *" fullWidth value={form.date} onChange={(val) => setForm({ ...form, date: val })} InputLabelProps={{ shrink: true }} />
            <CurrencyInput label="Monto *" fullWidth value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} />
            <TextField
              label="Método de Pago *"
              select
              fullWidth
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as 'efectivo' | 'transferencia' })}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.mark_as_paid}
                  onChange={(e) => setForm({ ...form, mark_as_paid: e.target.checked })}
                />
              }
              label="Ya se pagó en este momento"
            />
            {!form.mark_as_paid && (
              <Alert severity="info">
                Quedará como &quot;Pendiente de pago&quot;. Cuando se le pague, marcalo como pagado desde la tabla.
              </Alert>
            )}
            {form.payment_method === 'transferencia' && form.mark_as_paid && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Comprobante de Pago {selectedEmployees.length > 1 ? '(opcional para carga en lote)' : '*'}
                </Typography>
                <Button variant="outlined" component="label" fullWidth color={createProofFile ? 'success' : 'primary'}>
                  {createProofFile ? createProofFile.name : 'Seleccionar Archivo'}
                  <input type="file" hidden accept="image/*,.pdf,.xls,.xlsx,.csv" onChange={(e) => setCreateProofFile(e.target.files?.[0] || null)} />
                </Button>
                {selectedEmployees.length > 1 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Podés subir un único archivo para todo el lote (imagen, PDF o Excel con el detalle de las transferencias).
                  </Typography>
                )}
              </Box>
            )}
            <TextField label="Notas" fullWidth multiline rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={selectedEmployees.length === 0 || !form.amount || !form.date || (isCreateProofRequired && !createProofFile)}
          >
            Registrar {selectedEmployees.length > 1 ? `(${selectedEmployees.length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Aprobar adelanto */}
      <Dialog open={!!approveTarget} onClose={() => setApproveTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Aprobar Adelanto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {approveTarget?.employee?.lastname}, {approveTarget?.employee?.name} — pidió {approveTarget ? formatCurrency(Number(approveTarget.requested_amount ?? approveTarget.amount)) : ''}
            </Typography>
            {approveTarget?.conflict_warning && (
              <Alert severity="warning">{approveTarget.conflict_warning}</Alert>
            )}
            <CurrencyInput label="Monto a aprobar *" fullWidth value={approveAmount} onChange={setApproveAmount} />
            <TextField
              label="Método de Pago *"
              select
              fullWidth
              value={approvePaymentMethod}
              onChange={(e) => setApprovePaymentMethod(e.target.value as 'efectivo' | 'transferencia')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
            </TextField>
            <FormControlLabel
              control={
                <Checkbox
                  checked={approveMarkAsPaid}
                  onChange={(e) => setApproveMarkAsPaid(e.target.checked)}
                />
              }
              label="Pagado al momento de la aprobación"
            />
            {!approveMarkAsPaid && (
              <Alert severity="info">
                El adelanto quedará como &quot;Pendiente de pago&quot;. Cuando se le pague, marcalo como pagado desde la tabla.
              </Alert>
            )}
            {isApproveProofRequired && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Comprobante de Pago *</Typography>
                <Button variant="outlined" component="label" fullWidth color={approveProofFile ? 'success' : 'primary'}>
                  {approveProofFile ? approveProofFile.name : 'Seleccionar Archivo (Requerido)'}
                  <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setApproveProofFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveTarget(null)}>Cancelar</Button>
          <Button
            onClick={handleConfirmApprove}
            variant="contained"
            color="success"
            disabled={!approveAmount || processing || (isApproveProofRequired && !approveProofFile)}
          >
            {processing ? 'Aprobando...' : 'Aprobar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rechazar adelanto */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Adelanto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {rejectTarget?.employee?.lastname}, {rejectTarget?.employee?.name} — {rejectTarget ? formatCurrency(Number(rejectTarget.requested_amount ?? rejectTarget.amount)) : ''}
            </Typography>
            <TextField label="Motivo (opcional)" fullWidth multiline rows={2} value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectTarget(null)}>Cancelar</Button>
          <Button onClick={handleConfirmReject} variant="contained" color="error" disabled={processing}>
            {processing ? 'Rechazando...' : 'Rechazar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmar pago de adelanto */}
      <Dialog open={!!markPaidTarget} onClose={() => setMarkPaidTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar Pago de Adelanto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Vas a marcar como pagado el adelanto de <strong>{markPaidTarget?.employee?.lastname}, {markPaidTarget?.employee?.name}</strong> por <strong>{markPaidTarget ? formatCurrency(Number(markPaidTarget.amount)) : ''}</strong>.
            </Typography>
            <TextField
              label="Método de Pago *"
              select
              fullWidth
              value={markPaidMethod}
              onChange={(e) => setMarkPaidMethod(e.target.value as 'efectivo' | 'transferencia')}
              SelectProps={{ native: true }}
              InputLabelProps={{ shrink: true }}
            >
              <option value="transferencia">Transferencia bancaria</option>
              <option value="efectivo">Efectivo</option>
            </TextField>
            {isMarkPaidProofRequired && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Comprobante de Pago *</Typography>
                <Button variant="outlined" component="label" fullWidth color={markPaidProofFile ? 'success' : 'primary'}>
                  {markPaidProofFile ? markPaidProofFile.name : 'Seleccionar Archivo (Requerido)'}
                  <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setMarkPaidProofFile(e.target.files?.[0] || null)} />
                </Button>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkPaidTarget(null)}>Cancelar</Button>
          <Button
            onClick={handleConfirmMarkPaid}
            variant="contained"
            color="info"
            disabled={processing || (isMarkPaidProofRequired && !markPaidProofFile)}
          >
            {processing ? 'Confirmando...' : 'Confirmar Pago'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cargar comprobante de pago */}
      <Dialog open={!!uploadProofTarget} onClose={() => setUploadProofTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Cargar Comprobante de Pago</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              Adelanto de <strong>{uploadProofTarget?.employee?.lastname}, {uploadProofTarget?.employee?.name}</strong> por <strong>{uploadProofTarget ? formatCurrency(Number(uploadProofTarget.amount)) : ''}</strong>.
            </Typography>
            <Box>
              <Typography variant="subtitle2" gutterBottom>Comprobante *</Typography>
              <Button variant="outlined" component="label" fullWidth color={uploadProofFile ? 'success' : 'primary'}>
                {uploadProofFile ? uploadProofFile.name : 'Seleccionar Archivo (Requerido)'}
                <input type="file" hidden accept="image/*,.pdf,.xls,.xlsx,.csv" onChange={(e) => setUploadProofFile(e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadProofTarget(null)}>Cancelar</Button>
          <Button onClick={handleConfirmUploadProof} variant="contained" disabled={processing || !uploadProofFile}>
            {processing ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
